const prisma = require("../prisma/client");

async function identifyContact({ email, phoneNumber }) {

    const existingContacts = await prisma.contact.findMany({
    where: {
      OR: [
        email ? { email } : undefined,
        phoneNumber ? { phoneNumber } : undefined,
      ].filter(Boolean),
    },
    orderBy: { createdAt: "asc" },
  });


  if (existingContacts.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: "primary",
      },
    });

    return formatResponse(newContact, [], []);
  }

    let primaryContact = existingContacts.find(c => c.linkPrecedence === "primary") || existingContacts[0];

    if (primaryContact.linkPrecedence === "secondary" && primaryContact.linkedId) {

    const rootPrimary = await prisma.contact.findUnique({
        where: { id: primaryContact.linkedId },
    });

    if (rootPrimary) {
        primaryContact = rootPrimary;
    }
    }

    const allLinkedContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: primaryContact.id },
        { linkedId: primaryContact.id },
      ],
    },
    orderBy: { createdAt: "asc" },
  });


  const alreadyExists = allLinkedContacts.some(c =>
    c.email === email && c.phoneNumber === phoneNumber
  );

  let newContact = null;
  if (!alreadyExists) {

    newContact = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkedId: primaryContact.id,
        linkPrecedence: "secondary",
      },
    });
    allLinkedContacts.push(newContact);
  }

  return formatResponse(primaryContact, allLinkedContacts, newContact ? [newContact.id] : []);
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
    primaryContatctId: primary.id,
    emails: [primary.email, ...[...emails].filter(e => e && e !== primary.email)],
    phoneNumbers: [primary.phoneNumber, ...[...phoneNumbers].filter(p => p && p !== primary.phoneNumber)],
    secondaryContactIds,
  };
}

module.exports = { identifyContact };
