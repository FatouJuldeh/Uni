/**
 * Données de démonstration : `npm run db:seed`
 * Crée un compte administrateur, des groupes, des éducatrices, des enfants,
 * un emploi du temps et quelques présences.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function birth(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return iso(d);
}

async function main() {
  const adminPassword = await bcrypt.hash("admin1234", 10);
  const eduPassword = await bcrypt.hash("educ1234", 10);

  await prisma.user.upsert({
    where: { email: "admin@garderie.local" },
    update: {},
    create: { email: "admin@garderie.local", password: adminPassword, name: "Direction", role: "ADMIN" },
  });

  if ((await prisma.group.count()) > 0) {
    console.log("Des données existent déjà : seul le compte admin a été vérifié.");
    return;
  }

  const [marie, sophie, amina, julie] = await Promise.all([
    prisma.educator.create({
      data: {
        firstName: "Marie", lastName: "Tremblay", position: "Éducatrice", phone: "514 555-0101", email: "marie@garderie.local",
        hireDate: "2019-09-02", qualifications: "DEC Techniques d'éducation à l'enfance",
        shifts: { create: [1, 2, 3, 4, 5].map((weekday) => ({ weekday, startTime: "07:00", endTime: "15:00" })) },
      },
    }),
    prisma.educator.create({
      data: {
        firstName: "Sophie", lastName: "Gagnon", position: "Éducatrice", phone: "514 555-0102",
        hireDate: "2021-01-11",
        shifts: { create: [1, 2, 3, 4, 5].map((weekday) => ({ weekday, startTime: "09:00", endTime: "17:00" })) },
      },
    }),
    prisma.educator.create({
      data: {
        firstName: "Amina", lastName: "Diallo", position: "Éducatrice", phone: "514 555-0103",
        hireDate: "2022-08-22",
        shifts: { create: [1, 2, 3, 4, 5].map((weekday) => ({ weekday, startTime: "08:00", endTime: "16:00" })) },
      },
    }),
    prisma.educator.create({
      data: {
        firstName: "Julie", lastName: "Lavoie", position: "Aide-éducatrice", phone: "514 555-0104",
        hireDate: "2024-03-04",
        shifts: { create: [1, 3, 5].map((weekday) => ({ weekday, startTime: "10:00", endTime: "18:00" })) },
      },
    }),
  ]);

  await prisma.user.create({
    data: { email: "marie@garderie.local", password: eduPassword, name: "Marie Tremblay", role: "EDUCATRICE", educatorId: marie.id },
  });

  await prisma.leave.create({
    data: { educatorId: julie.id, startDate: iso(daysAgo(-3)), endDate: iso(daysAgo(-7)), type: "CONGE", note: "Vacances" },
  });

  const poupons = await prisma.group.create({
    data: {
      name: "Poupons", ageMin: 3, ageMax: 18, color: "#f97316", room: "Salle Soleil", capacity: 5,
      educators: { create: [{ educatorId: marie.id, isLead: true }] },
    },
  });
  const bambins = await prisma.group.create({
    data: {
      name: "Bambins", ageMin: 18, ageMax: 36, color: "#0d9488", room: "Salle Arc-en-ciel", capacity: 8,
      educators: { create: [{ educatorId: sophie.id, isLead: true }, { educatorId: julie.id }] },
    },
  });
  const prescolaires = await prisma.group.create({
    data: {
      name: "Préscolaires", ageMin: 36, ageMax: 60, color: "#7c3aed", room: "Salle Étoiles", capacity: 10,
      educators: { create: [{ educatorId: amina.id, isLead: true }] },
    },
  });

  const kids: { firstName: string; lastName: string; months: number; gender: string; group: string; allergies?: string; parent: string; phone: string }[] = [
    { firstName: "Léa", lastName: "Bouchard", months: 9, gender: "F", group: poupons.id, parent: "Catherine Bouchard", phone: "514 555-0201" },
    { firstName: "Noah", lastName: "Côté", months: 14, gender: "M", group: poupons.id, allergies: "Lait de vache", parent: "Simon Côté", phone: "514 555-0202" },
    { firstName: "Emma", lastName: "Roy", months: 16, gender: "F", group: poupons.id, parent: "Valérie Roy", phone: "514 555-0203" },
    { firstName: "Liam", lastName: "Fortin", months: 22, gender: "M", group: bambins.id, parent: "Mélanie Fortin", phone: "514 555-0204" },
    { firstName: "Chloé", lastName: "Nguyen", months: 26, gender: "F", group: bambins.id, allergies: "Arachides", parent: "Thu Nguyen", phone: "514 555-0205" },
    { firstName: "Adam", lastName: "Benali", months: 30, gender: "M", group: bambins.id, parent: "Karim Benali", phone: "514 555-0206" },
    { firstName: "Zoé", lastName: "Pelletier", months: 33, gender: "F", group: bambins.id, parent: "Isabelle Pelletier", phone: "514 555-0207" },
    { firstName: "Nathan", lastName: "Lévesque", months: 40, gender: "M", group: prescolaires.id, parent: "Julie Lévesque", phone: "514 555-0208" },
    { firstName: "Alice", lastName: "Martin", months: 44, gender: "F", group: prescolaires.id, allergies: "Œufs", parent: "Pierre Martin", phone: "514 555-0209" },
    { firstName: "Gabriel", lastName: "Dubé", months: 48, gender: "M", group: prescolaires.id, parent: "Annie Dubé", phone: "514 555-0210" },
    { firstName: "Olivia", lastName: "Sánchez", months: 52, gender: "F", group: prescolaires.id, parent: "Carla Sánchez", phone: "514 555-0211" },
    { firstName: "Louis", lastName: "Girard", months: 56, gender: "M", group: prescolaires.id, parent: "Marc Girard", phone: "514 555-0212" },
  ];

  const children = [];
  for (const k of kids) {
    children.push(
      await prisma.child.create({
        data: {
          firstName: k.firstName, lastName: k.lastName, birthDate: birth(k.months), gender: k.gender, groupId: k.group,
          allergies: k.allergies, startDate: iso(daysAgo(120)),
          guardians: { create: [{ name: k.parent, relation: k.parent.split(" ")[0].endsWith("e") ? "Mère" : "Père", phone: k.phone, isPrimary: true }] },
        },
      }),
    );
  }

  // Présences des 10 derniers jours ouvrés
  const statuses = ["PRESENT", "PRESENT", "PRESENT", "PRESENT", "PRESENT", "RETARD", "ABSENT", "EXCUSE"];
  let seed = 7;
  const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let n = 1; n <= 14; n++) {
    const d = daysAgo(n);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    for (const c of children) {
      const status = statuses[Math.floor(rand() * statuses.length)];
      const present = status === "PRESENT" || status === "RETARD";
      await prisma.attendance.create({
        data: {
          childId: c.id, date: iso(d), status,
          arrivalTime: present ? `0${7 + Math.floor(rand() * 2)}:${String(Math.floor(rand() * 60)).padStart(2, "0")}` : null,
          departureTime: present ? `1${5 + Math.floor(rand() * 3)}:${String(Math.floor(rand() * 60)).padStart(2, "0")}` : null,
          recordedBy: "Direction",
        },
      });
    }
  }

  // Emploi du temps type
  const base = (groupId: string, educatorId: string, older: boolean) => {
    const rows = [
      { startTime: "07:00", endTime: "09:00", title: "Accueil et jeux libres", category: "ACCUEIL" },
      { startTime: "09:00", endTime: "09:30", title: "Collation", category: "REPAS" },
      { startTime: "09:30", endTime: "10:30", title: older ? "Atelier créatif" : "Éveil sensoriel", category: "ACTIVITE" },
      { startTime: "10:30", endTime: "11:30", title: "Jeux extérieurs", category: "SORTIE", location: "Cour" },
      { startTime: "11:30", endTime: "12:15", title: "Dîner", category: "REPAS" },
      { startTime: "12:30", endTime: "14:30", title: older ? "Repos / lecture" : "Sieste", category: "SIESTE" },
      { startTime: "14:30", endTime: "15:00", title: "Collation", category: "REPAS" },
      { startTime: "15:00", endTime: "16:00", title: older ? "Motricité et musique" : "Jeux calmes", category: "ACTIVITE" },
      { startTime: "16:00", endTime: "18:00", title: "Jeux libres et départs", category: "ACCUEIL" },
    ];
    return [1, 2, 3, 4, 5].flatMap((weekday) => rows.map((r) => ({ ...r, weekday, groupId, educatorId })));
  };
  await prisma.scheduleSlot.createMany({
    data: [...base(poupons.id, marie.id, false), ...base(bambins.id, sophie.id, false), ...base(prescolaires.id, amina.id, true)],
  });

  console.log("Données de démonstration créées.");
  console.log("Connexion : admin@garderie.local / admin1234  (ou marie@garderie.local / educ1234)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
