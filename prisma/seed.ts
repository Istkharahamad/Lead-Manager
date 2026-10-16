import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.lead.deleteMany();
  await prisma.lead.createMany({
    data: [
      { name: "Priya Nair", company: "Northwind Logistics", email: "priya@northwind.example", event: "SaaStr Annual 2026", status: "NEW",
        notes: "Met at the booth. Head of RevOps. Struggling to attribute pipeline to events. Wants to see a demo next month. Mentioned budget cycle starts in January." },
      { name: "Daniel Okafor", company: "Brightpath Health", email: "daniel@brightpath.example", event: "HLTH Europe", status: "CONTACTED",
        notes: "Talked for 15 mins after the panel. Runs marketing for 3 regions. Interested in measuring post-event conversations. Asked for a case study." },
      { name: "Meera Kapoor", company: "Lumen Fintech", email: "meera@lumen.example", event: "SaaStr Annual 2026", status: "MEETING_SCHEDULED",
        notes: "Intro call booked for Tuesday. CMO. Currently uses spreadsheets to track leads from 12 events a year." },
      { name: "Tom Becker", company: "Hexa Robotics", email: "tom@hexa.example", event: "Web Summit", status: "REPLIED",
        notes: "Replied to our email with two questions about CRM integrations (HubSpot). Sounds keen but timeline unclear." },
      { name: "Aiko Tanaka", company: "Shiori Labs", email: "aiko@shiori.example", event: "Web Summit", status: "CLOSED",
        notes: "Not a fit right now, team too small. Happy to reconnect in six months." },
    ],
  });
}

main().finally(() => prisma.$disconnect());
