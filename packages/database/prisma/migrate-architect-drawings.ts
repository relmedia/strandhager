import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma";
import { site } from "../../../apps/web/lib/site-content";

/**
 * One-off: attaches the architects' PDF drawings to the Parsellene section and
 * drops the inset image that the section no longer renders. Everything else in
 * the stored section is left exactly as the editors saved it.
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

type StoredPerson = {
  name: string;
  role: string;
  document?: { label: string; url: string; preview: string; previewAlt: string };
};

type StoredParsellene = {
  architects?: { title: string; people?: StoredPerson[] };
  secondaryImage?: string;
  secondaryImageAlt?: string;
  [key: string]: unknown;
};

const fallback = site.parsellene.architects;

async function main() {
  const row = await prisma.siteSection.findUnique({ where: { key: "parsellene" } });

  if (!row) {
    throw new Error('No "parsellene" section stored yet — run the seed first.');
  }

  const { secondaryImage, secondaryImageAlt, ...stored } = row.data as StoredParsellene;
  const storedPeople = stored.architects?.people ?? [];

  const people =
    storedPeople.length > 0
      ? storedPeople.map((person) => ({
          ...person,
          document:
            person.document ??
            fallback.people.find((candidate) => candidate.name === person.name)?.document,
        }))
      : fallback.people;

  const data = {
    ...stored,
    architects: {
      // Only rename the heading if the editors never changed it themselves.
      title: stored.architects?.title === "Arkitektene" ? fallback.title : (stored.architects?.title ?? fallback.title),
      people,
    },
  };

  await prisma.siteSection.update({ where: { key: "parsellene" }, data: { data } });

  const withDocs = people.filter((person) => person.document?.url).length;
  console.log(`parsellene: ${people.length} arkitekter, ${withDocs} med tegninger`);
  console.log(`dropped inset image: ${secondaryImage ?? "(none)"} / ${secondaryImageAlt ?? "(none)"}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
