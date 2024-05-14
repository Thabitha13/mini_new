const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");

const generateInvoice = async (order, user) => {
  const pdfDoc = new PDFDocument({ margins: { top: 50, bottom: 50, left: 50, right: 50 } });
  const orderId = order._id.toString();
  const pdfFilePath = `./${orderId}-bill.pdf`;
  pdfDoc.pipe(fs.createWriteStream(pdfFilePath));

  // Register the font with the rupee symbol
  pdfDoc.registerFont("NotoSans", "NotoSans-Regular.ttf");

  // Add logo
  const logoPath = "logo.jpeg"; // Replace with the actual path to your logo file
  const logo = pdfDoc.openImage(logoPath);
  pdfDoc.image(logo, 50, 50, { width: 100 }); // Adjust logo size and position as needed

  // Add border
  pdfDoc.rect(0, 0, pdfDoc.page.width, pdfDoc.page.height).stroke();

  pdfDoc.moveDown(3);

  // Title
  pdfDoc.font("NotoSans");
  pdfDoc.fontSize(24);
  pdfDoc.text("Invoice", { align: "center" });

  pdfDoc.moveDown();

  // Set up fonts and styles for regular text
  pdfDoc.fontSize(12);

  // Order details
  pdfDoc.text(`Order ID: ${orderId}`);
  pdfDoc.text(`Accepted At: ${new Date().toLocaleDateString()}`);
  pdfDoc.text(`Customer: ${user.name}`);
  pdfDoc.text(`Email: ${user.email}`);

  pdfDoc.moveDown();

  // Create table headers and data
  const tableHeaders = ["Item", "Quantity", "Total"];
  const tableWidths = [120, 80, 100]; // Adjust column widths as needed
  const tableData = [["Water Can", order.totalCans, `₹${(order.totalCans * 50).toFixed(2)}`]];

  // Draw the table
  drawTable(pdfDoc, tableHeaders, tableWidths, tableData);

  pdfDoc.end();
  return pdfFilePath;
};

// Helper function to draw a table
function drawTable(doc, headers, widths, data) {
  const headerHeight = 15;
  const rowHeight = 15;
  const borderWidth = 1;

  // Draw header row
  const startY = doc.y;
  doc.font("NotoSans");
  doc.fontSize(12);
  headers.forEach((header, i) => {
    const x = widths.slice(0, i).reduce((sum, w) => sum + w, 0);
    doc.text(header, x + borderWidth, startY + borderWidth, { width: widths[i] - borderWidth * 2 });
  });
  doc.moveDown(headerHeight);

  // Draw data rows
  data.forEach((row) => {
    row.forEach((cell, i) => {
      const x = widths.slice(0, i).reduce((sum, w) => sum + w, 0);
      doc.text(cell.toString(), x + borderWidth, doc.y + borderWidth, { width: widths[i] - borderWidth * 2, align: "right" });
    });
    doc.moveDown(rowHeight);
  });

  // Draw table borders
  const endY = doc.y;
  doc.lineWidth(borderWidth);
  headers.forEach((_, i) => {
    const x = widths.slice(0, i).reduce((sum, w) => sum + w, 0);
    doc.moveTo(x, startY).lineTo(x, endY).stroke();
  });
  doc.moveTo(0, startY).lineTo(widths.reduce((sum, w) => sum + w, 0), startY).stroke();
  doc.moveTo(0, endY).lineTo(widths.reduce((sum, w) => sum + w, 0), endY).stroke();
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