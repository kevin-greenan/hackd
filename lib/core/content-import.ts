import { readFile } from "fs/promises";
import path from "path";
import { ChallengeType, ContentStatus, Prisma, Role } from "@prisma/client";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { prisma } from "../db/prisma";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const tagsSchema = z.array(z.string().trim().min(1).max(40)).max(20).default([]);

const jsonConfigSchema = z.unknown().nullable().default(null);

const challengeImportSchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug: slugSchema,
  description: z.string().trim().min(5).max(1000),
  type: z.nativeEnum(ChallengeType),
  difficulty: z.string().trim().min(2).max(60),
  points: z.number().int().min(0).max(10000).default(0),
  status: z.nativeEnum(ContentStatus).default(ContentStatus.DRAFT),
  tags: tagsSchema,
  validationConfig: jsonConfigSchema,
  runtimeConfig: jsonConfigSchema
});

const moduleChallengeImportSchema = z.object({
  slug: slugSchema,
  sortOrder: z.number().int().min(0).max(10000).default(0),
  required: z.boolean().default(true)
});

const moduleImportSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    slug: slugSchema,
    summary: z.string().trim().min(10).max(500),
    bodyMarkdown: z.string().trim().min(1).max(20000).optional(),
    bodyFile: z.string().trim().min(1).max(500).optional(),
    difficulty: z.string().trim().min(2).max(60),
    estimatedMinutes: z.number().int().min(0).nullable().default(null),
    status: z.nativeEnum(ContentStatus).default(ContentStatus.DRAFT),
    tags: tagsSchema,
    challenges: z.array(moduleChallengeImportSchema).default([])
  })
  .refine((module) => Boolean(module.bodyMarkdown) !== Boolean(module.bodyFile), {
    message: "Each module must define exactly one of bodyMarkdown or bodyFile.",
    path: ["bodyMarkdown"]
  });

export const contentImportBundleSchema = z.object({
  version: z.literal(1),
  modules: z.array(moduleImportSchema).min(1),
  challenges: z.array(challengeImportSchema).default([])
});

export type ContentImportBundle = z.infer<typeof contentImportBundleSchema>;

export type ContentImportPlan = {
  challengeCreates: number;
  challengeUpdates: number;
  linkCreates: number;
  linkUpdates: number;
  moduleCreates: number;
  moduleUpdates: number;
};

export type ContentImportResult = {
  dryRun: boolean;
  plan: ContentImportPlan;
};

function toPrismaJson(value: unknown) {
  return value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

function duplicateValues(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
      return;
    }

    seen.add(value);
  });

  return [...duplicates].sort();
}

function assertNoDuplicateSlugs(bundle: ContentImportBundle) {
  const duplicateModules = duplicateValues(bundle.modules.map((module) => module.slug));
  const duplicateChallenges = duplicateValues(bundle.challenges.map((challenge) => challenge.slug));
  const duplicateLinks = bundle.modules.flatMap((module) => {
    return duplicateValues(module.challenges.map((challenge) => challenge.slug)).map(
      (slug) => `${module.slug}:${slug}`
    );
  });
  const errors = [
    ...duplicateModules.map((slug) => `Duplicate module slug: ${slug}`),
    ...duplicateChallenges.map((slug) => `Duplicate challenge slug: ${slug}`),
    ...duplicateLinks.map((slug) => `Duplicate module challenge link: ${slug}`)
  ];

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}

function assertChallengeReferencesExist(bundle: ContentImportBundle) {
  const challengeSlugs = new Set(bundle.challenges.map((challenge) => challenge.slug));
  const missingRefs = bundle.modules.flatMap((module) =>
    module.challenges
      .filter((challenge) => !challengeSlugs.has(challenge.slug))
      .map((challenge) => `${module.slug}:${challenge.slug}`)
  );

  if (missingRefs.length > 0) {
    throw new Error(`Unknown challenge references: ${missingRefs.join(", ")}`);
  }
}

export function validateContentImportBundle(input: unknown) {
  const bundle = contentImportBundleSchema.parse(input);

  assertNoDuplicateSlugs(bundle);
  assertChallengeReferencesExist(bundle);

  return bundle;
}

function parseImportContent(filePath: string, content: string) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".json") {
    return JSON.parse(content);
  }

  if (ext === ".yaml" || ext === ".yml") {
    return parseYaml(content);
  }

  throw new Error("Content import files must use .json, .yaml, or .yml.");
}

function resolveBodyFile(bundlePath: string, bodyFile: string) {
  if (path.isAbsolute(bodyFile)) {
    throw new Error(`Module bodyFile must be relative: ${bodyFile}`);
  }

  const baseDir = path.dirname(path.resolve(bundlePath));
  const resolvedPath = path.resolve(baseDir, bodyFile);
  const allowedPrefix = `${baseDir}${path.sep}`;

  if (resolvedPath !== baseDir && !resolvedPath.startsWith(allowedPrefix)) {
    throw new Error(`Module bodyFile must stay inside the content directory: ${bodyFile}`);
  }

  return resolvedPath;
}

export async function loadContentImportFile(filePath: string) {
  const content = await readFile(filePath, "utf8");
  const parsed = parseImportContent(filePath, content);
  const bundle = validateContentImportBundle(parsed);
  const modules = await Promise.all(
    bundle.modules.map(async (module) => {
      if (!module.bodyFile) {
        return module;
      }

      const bodyMarkdown = await readFile(resolveBodyFile(filePath, module.bodyFile), "utf8");

      return {
        ...module,
        bodyFile: undefined,
        bodyMarkdown
      };
    })
  );

  return validateContentImportBundle({
    ...bundle,
    modules
  });
}

async function buildImportPlan(bundle: ContentImportBundle): Promise<ContentImportPlan> {
  const moduleSlugs = bundle.modules.map((module) => module.slug);
  const challengeSlugs = bundle.challenges.map((challenge) => challenge.slug);
  const [existingModules, existingChallenges] = await Promise.all([
    prisma.module.findMany({
      where: { slug: { in: moduleSlugs } },
      select: { id: true, slug: true }
    }),
    prisma.challenge.findMany({
      where: { slug: { in: challengeSlugs } },
      select: { id: true, slug: true }
    })
  ]);
  const existingModuleSlugs = new Set(existingModules.map((module) => module.slug));
  const existingChallengeSlugs = new Set(existingChallenges.map((challenge) => challenge.slug));
  const moduleIdBySlug = new Map(existingModules.map((module) => [module.slug, module.id]));
  const challengeIdBySlug = new Map(existingChallenges.map((challenge) => [challenge.slug, challenge.id]));
  const existingLinkPairs = new Set<string>();

  const existingLinkLookups = bundle.modules.flatMap((module) => {
    const moduleId = moduleIdBySlug.get(module.slug);

    if (!moduleId) {
      return [];
    }

    return module.challenges.flatMap((challenge) => {
      const challengeId = challengeIdBySlug.get(challenge.slug);

      return challengeId
        ? [
            {
              moduleId,
              challengeId
            }
          ]
        : [];
    });
  });

  if (existingLinkLookups.length > 0) {
    const existingLinks = await prisma.moduleChallenge.findMany({
      where: {
        OR: existingLinkLookups
      },
      select: {
        moduleId: true,
        challengeId: true
      }
    });

    existingLinks.forEach((link) => existingLinkPairs.add(`${link.moduleId}:${link.challengeId}`));
  }

  const linkUpdates = bundle.modules.reduce((count, module) => {
    const moduleId = moduleIdBySlug.get(module.slug);

    if (!moduleId) {
      return count;
    }

    return (
      count +
      module.challenges.filter((challenge) => {
        const challengeId = challengeIdBySlug.get(challenge.slug);

        return challengeId ? existingLinkPairs.has(`${moduleId}:${challengeId}`) : false;
      }).length
    );
  }, 0);
  const totalLinks = bundle.modules.reduce((count, module) => count + module.challenges.length, 0);

  return {
    challengeCreates: bundle.challenges.filter((challenge) => !existingChallengeSlugs.has(challenge.slug)).length,
    challengeUpdates: bundle.challenges.filter((challenge) => existingChallengeSlugs.has(challenge.slug)).length,
    linkCreates: totalLinks - linkUpdates,
    linkUpdates,
    moduleCreates: bundle.modules.filter((module) => !existingModuleSlugs.has(module.slug)).length,
    moduleUpdates: bundle.modules.filter((module) => existingModuleSlugs.has(module.slug)).length
  };
}

export async function findContentImportActor(actorEmail?: string) {
  const actor = await prisma.user.findFirst({
    where: {
      role: Role.ADMIN,
      ...(actorEmail ? { email: actorEmail.toLowerCase() } : {})
    },
    orderBy: { email: "asc" },
    select: {
      id: true,
      email: true
    }
  });

  if (!actor) {
    throw new Error(actorEmail ? `Admin actor not found: ${actorEmail}` : "No admin actor found.");
  }

  return actor;
}

export async function importContentBundle({
  actorUserId,
  bundle,
  dryRun = false
}: {
  actorUserId: string;
  bundle: ContentImportBundle;
  dryRun?: boolean;
}): Promise<ContentImportResult> {
  const plan = await buildImportPlan(bundle);

  if (dryRun) {
    return {
      dryRun,
      plan
    };
  }

  await prisma.$transaction(async (tx) => {
    const challengeIdsBySlug = new Map<string, string>();
    const moduleIdsBySlug = new Map<string, string>();

    for (const challenge of bundle.challenges) {
      const importedChallenge = await tx.challenge.upsert({
        where: { slug: challenge.slug },
        update: {
          title: challenge.title,
          description: challenge.description,
          type: challenge.type,
          difficulty: challenge.difficulty,
          points: challenge.points,
          tags: challenge.tags,
          validationConfig: toPrismaJson(challenge.validationConfig),
          runtimeConfig: toPrismaJson(challenge.runtimeConfig),
          status: challenge.status
        },
        create: {
          title: challenge.title,
          slug: challenge.slug,
          description: challenge.description,
          type: challenge.type,
          difficulty: challenge.difficulty,
          points: challenge.points,
          tags: challenge.tags,
          validationConfig: toPrismaJson(challenge.validationConfig),
          runtimeConfig: toPrismaJson(challenge.runtimeConfig),
          status: challenge.status,
          createdById: actorUserId
        }
      });

      challengeIdsBySlug.set(importedChallenge.slug, importedChallenge.id);
    }

    for (const learningModule of bundle.modules) {
      const importedModule = await tx.module.upsert({
        where: { slug: learningModule.slug },
        update: {
          title: learningModule.title,
          summary: learningModule.summary,
          bodyMarkdown: learningModule.bodyMarkdown ?? "",
          difficulty: learningModule.difficulty,
          estimatedMinutes: learningModule.estimatedMinutes,
          status: learningModule.status,
          tags: learningModule.tags
        },
        create: {
          title: learningModule.title,
          slug: learningModule.slug,
          summary: learningModule.summary,
          bodyMarkdown: learningModule.bodyMarkdown ?? "",
          difficulty: learningModule.difficulty,
          estimatedMinutes: learningModule.estimatedMinutes,
          status: learningModule.status,
          tags: learningModule.tags,
          createdById: actorUserId
        }
      });

      moduleIdsBySlug.set(importedModule.slug, importedModule.id);
    }

    for (const learningModule of bundle.modules) {
      const moduleId = moduleIdsBySlug.get(learningModule.slug);

      if (!moduleId) {
        throw new Error(`Imported module was not resolved: ${learningModule.slug}`);
      }

      for (const challenge of learningModule.challenges) {
        const challengeId = challengeIdsBySlug.get(challenge.slug);

        if (!challengeId) {
          throw new Error(`Imported challenge was not resolved: ${challenge.slug}`);
        }

        await tx.moduleChallenge.upsert({
          where: {
            moduleId_challengeId: {
              moduleId,
              challengeId
            }
          },
          update: {
            sortOrder: challenge.sortOrder,
            required: challenge.required
          },
          create: {
            moduleId,
            challengeId,
            sortOrder: challenge.sortOrder,
            required: challenge.required
          }
        });
      }
    }
  });

  return {
    dryRun,
    plan
  };
}
