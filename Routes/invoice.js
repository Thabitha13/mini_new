const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");

const generateInvoice = async (order, user) => {
  const pdfDoc = new PDFDocument({ size: "A4", margin: 50 });
  const orderId = order._id.toString();
  const pdfFilePath = `./${orderId}-bill.pdf`;
  pdfDoc.pipe(fs.createWriteStream(pdfFilePath));

  // Register the font with the rupee symbol
  pdfDoc.registerFont("NotoSans", "NotoSans-Regular.ttf");

  generateHeader(pdfDoc);
  generateCustomerInformation(pdfDoc, order, user);
  generateInvoiceTable(pdfDoc, order);
  generateFooter(pdfDoc);

  pdfDoc.end();
  return pdfFilePath;
};

function generateHeader(doc) {
  doc
    .image("logo.jpeg", 50, 45, { width: 50 }) // Replace with your logo path
    .fillColor("#444444")
    .font("NotoSans")
    .fontSize(20)
    .text("Varsh Waters", 110, 57) // Company name
    .fontSize(10)
    .text("Kizhakombu Koothatkulam", 200, 50, { align: "right" }) // Sender's address
    .text("Ernakulam Pin 686662", 200, 65, { align: "right" })
    .moveDown();
}

function generateCustomerInformation(doc, order, user) {
  doc
    .fillColor("#444444")
    .fontSize(20)
    .text("Invoice", 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text("Order ID:", 50, customerInformationTop)
    .font("NotoSans")
    .text(order._id.toString(), 150, customerInformationTop)
    .font("NotoSans")
    .text("Accepted At:", 50, customerInformationTop + 15)
    .text(formatDate(new Date()), 150, customerInformationTop + 15)
    .text("Balance Due:", 50, customerInformationTop + 30)
    .text(
      formatCurrency((order.totalCans * 50).toFixed(2)),
      150,
      customerInformationTop + 30
    )

    .font("NotoSans")
    .text(user.name, 300, customerInformationTop)
    .font("NotoSans")
    .text(user.email, 300, customerInformationTop + 15)
    .moveDown();

  generateHr(doc, 252);
}

function generateInvoiceTable(doc, order) {
  const invoiceTableTop = 330;

  doc.font("NotoSans");
  generateTableRow(
    doc,
    invoiceTableTop,
    "Item",
    "Description",
    "Unit Cost",
    "Quantity",
    "Line Total"
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font("NotoSans");

  const item = {
    item: "Water Can",
    description: "1 Litre",
    amount: order.totalCans * 50,
    quantity: order.totalCans,
  };
  const position = invoiceTableTop + 30;
  generateTableRow(
    doc,
    position,
    item.item,
    item.description,
    formatCurrency(50),
    item.quantity,
    formatCurrency(item.amount)
  );

  generateHr(doc, position + 20);

  const totalPosition = position + 30;
  generateTableRow(
    doc,
    totalPosition,
    "",
    "",
    "Total",
    "",
    formatCurrency(item.amount)
  );

  const duePosition = totalPosition + 25;
  doc.font("NotoSans");
  generateTableRow(
    doc,
    duePosition,
    "",
    "",
    "Balance Due",
    "",
    formatCurrency(item.amount)
  );
  doc.font("NotoSans");
}

function generateFooter(doc) {
  doc
    .fontSize(10)
    .text(
      "Payment is due within 15 days. Thank you for your business.",
      50,
      600,
      { align: "center", width: 500 }
    );
}

function generateTableRow(
  doc,
  y,
  item,
  description,
  unitCost,
  quantity,
  lineTotal
) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(description, 150, y)
    .text(unitCost, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}

function generateHr(doc, y) {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

function formatCurrency(cents) {
  return "₹" + cents;
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return year + "/" + month + "/" + day;
}

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  auth: {
    user: "varshwaters@gmail.com", // Replace with your email address
    pass: "xmnt ikbd dkut knzo", // Replace with your email password
  },
});

// Send the email with the PDF attachment
const sendInvoiceEmail = async (order, user) => {
  const pdfFilePath = await generateInvoice(order, user);
  const mailOptions = {
    from: "varshwaters@gmail.com", // Replace with your email address
    to: user.email, // Using the user's email from the userSchema
    subject: "Order Accepted",
    html: `
      <div style="background-color: #f5f5f5; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333; font-weight: bold;">Order Accepted by Varsh Waters</h2>
        <p style="font-size: 16px; color: #555;">Dear ${user.name},</p>
        <p style="font-size: 16px; color: #555;">Your order has been accepted. The bill is attached below.</p>
      </div>
    `,
    attachments: [{ filename: "bill.pdf", path: pdfFilePath }],
  };
  await transporter.sendMail(mailOptions);
  fs.unlinkSync(pdfFilePath); // Delete the temporary PDF file
};

module.exports = {
  generateInvoice,
  sendInvoiceEmail
};