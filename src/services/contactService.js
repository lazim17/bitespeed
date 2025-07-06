const prisma = require("../prisma/client");

async function identifyContact({ email, phoneNumber }) {
  let matchedContacts = await prisma.contact.findMany({
    where: {
      OR: [
        email ? { email } : undefined,
        phoneNumber ? { phoneNumber } : undefined,
      ].filter(Boolean),
    },
    orderBy: { createdAt: "asc" },
  });

  if (matchedContacts.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: "primary",
      },
    });
    return formatResponse(newContact, [], []);
  }

  const alreadyExists = matchedContacts.some(
    c => c.email === email && c.phoneNumber === phoneNumber
  );

  let newContact = null;
  if (!alreadyExists) {
    const oldest = matchedContacts[0];
    newContact = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkedId: oldest.id,
        linkPrecedence: "secondary",
      },
    });

    matchedContacts.push(newContact);
  }

  const allContacts = await prisma.contact.findMany({
    where: {
      OR: [
        ...[email, phoneNumber]
          .filter(Boolean)
          .flatMap(value => [
            { email: value },
            { phoneNumber: value }
          ])
      ]
    },
    orderBy: { createdAt: "asc" },
  });

  const allPrimaries = allContacts.filter(c => c.linkPrecedence === "primary");
  let truePrimary = allPrimaries[0] || allContacts[0];

  while (truePrimary.linkedId) {
    const parent = await prisma.contact.findUnique({
      where: { id: truePrimary.linkedId },
    });
    if (!parent) break;
    truePrimary = parent;
  }

  for (const contact of allPrimaries) {
    if (contact.id !== truePrimary.id) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          linkedId: truePrimary.id,
          linkPrecedence: "secondary",
        },
      });
    }
  }

  const linkedContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: truePrimary.id },
        { linkedId: truePrimary.id },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  return formatResponse(truePrimary, linkedContacts, newContact ? [newContact.id] : []);
}

function formatResponse(primary, allContacts, newSecondaryIds) {
  const emails = new Set();
  const phoneNumbers = new Set();
  const secondaryContactIds = [];

  for (const contact of allContacts) {
    if (contact.linkPrecedence === "primary" && contact.id === primary.id) {
      if (contact.email) emails.add(contact.email);
      if (contact.phoneNumber) phoneNumbers.add(contact.phoneNumber);
    } else {
      if (contact.email) emails.add(contact.email);
      if (contact.phoneNumber) phoneNumbers.add(contact.phoneNumber);
      secondaryContactIds.push(contact.id);
    }
  }

  return {
    contact: {
      primaryContatctId: primary.id,
      emails: [primary.email, ...[...emails].filter(e => e && e !== primary.email)],
      phoneNumbers: [primary.phoneNumber, ...[...phoneNumbers].filter(p => p && p !== primary.phoneNumber)],
      secondaryContactIds,
    },
  };
}

module.exports = { identifyContact };
