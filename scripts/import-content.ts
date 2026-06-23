import { prisma } from "../lib/db/prisma";
import {
  findContentImportActor,
  importContentBundle,
  loadContentImportFile
} from "../lib/core/content-import";

type ImportArgs = {
  actorEmail?: string;
  dryRun: boolean;
  file?: string;
};

function parseArgs(argv: string[]): ImportArgs {
  const args: ImportArgs = {
    dryRun: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (arg === "--file") {
      args.file = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--actor-email") {
      args.actorEmail = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!args.file) {
    throw new Error("Missing required --file argument.");
  }

  return args;
}

function printHelp() {
  console.log(`Import modules and challenges from a YAML or JSON content bundle.

Usage:
  npm run content:import -- --file examples/content/secure-notes.yaml

Options:
  --file <path>          Required YAML or JSON content bundle path.
  --actor-email <email>  Admin email to record as creator for new rows.
  --dry-run             Validate and print the create/update plan without writing.
  --help                Show this message.
`);
}

function printPlan({
  dryRun,
  plan
}: {
  dryRun: boolean;
  plan: {
    challengeCreates: number;
    challengeUpdates: number;
    linkCreates: number;
    linkUpdates: number;
    moduleCreates: number;
    moduleUpdates: number;
  };
}) {
  console.log(dryRun ? "Content import dry run complete." : "Content import complete.");
  console.log(`Modules: ${plan.moduleCreates} create, ${plan.moduleUpdates} update`);
  console.log(`Challenges: ${plan.challengeCreates} create, ${plan.challengeUpdates} update`);
  console.log(`Module links: ${plan.linkCreates} create, ${plan.linkUpdates} update`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const bundle = await loadContentImportFile(args.file as string);
  const actor = await findContentImportActor(args.actorEmail ?? process.env.SEED_ADMIN_EMAIL);
  const result = await importContentBundle({
    actorUserId: actor.id,
    bundle,
    dryRun: args.dryRun
  });

  console.log(`Actor: ${actor.email}`);
  printPlan(result);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
