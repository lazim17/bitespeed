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



  const primaryContacts = existingContacts.filter(c => c.linkPrecedence === "primary");

    const truePrimary = primaryContacts[0] || existingContacts[0];

    for (const contact of primaryContacts) {
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
  const allLinkedContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: truePrimary.id },
        { linkedId: truePrimary.id },
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
        linkedId: truePrimary.id,
        linkPrecedence: "secondary",
      },
    });
    allLinkedContacts.push(newContact);
  }

  return formatResponse(truePrimary, allLinkedContacts, newContact ? [newContact.id] : []);
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
