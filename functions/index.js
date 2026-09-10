const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const nodemailer = require("nodemailer");

const SMTP_HOST = defineSecret("SMTP_HOST");
const SMTP_PORT = defineSecret("SMTP_PORT");
const SMTP_SECURE = defineSecret("SMTP_SECURE");
const SMTP_USER = defineSecret("SMTP_USER");
const SMTP_PASS = defineSecret("SMTP_PASS");
const MAIL_FROM = defineSecret("MAIL_FROM");

const ORGANIZER_UID = "fS56FR5b2vdd632fpUZWXbJFWwj1";

exports.sendCertificateEmail = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 120,
    memory: "512MiB",

    secrets: [
      SMTP_HOST,
      SMTP_PORT,
      SMTP_SECURE,
      SMTP_USER,
      SMTP_PASS,
      MAIL_FROM
    ]
  },

  async (request) => {

    /*
    ============================================
    التأكد أن المستخدم هو المنظم
    ============================================
    */

    if (
      !request.auth ||
      request.auth.uid !== ORGANIZER_UID
    ) {

      throw new HttpsError(
        "permission-denied",
        "غير مصرح بإرسال الشهادات."
      );

    }


    /*
    ============================================
    استقبال البيانات
    ============================================
    */

    const {
      to,
      fullName,
      certId,
      pdfBase64
    } = request.data || {};


    /*
    ============================================
    التأكد من البيانات
    ============================================
    */

    if (
      !to ||
      !pdfBase64 ||
      !certId
    ) {

      throw new HttpsError(
        "invalid-argument",
        "بيانات الإرسال ناقصة: البريد أو رقم الشهادة أو ملف PDF."
      );

    }


    /*
    ============================================
    حماية من الملفات الكبيرة جدًا
    ============================================
    */

    if (
      typeof pdfBase64 !== "string" ||
      pdfBase64.length > 15000000
    ) {

      throw new HttpsError(
        "invalid-argument",
        "حجم ملف PDF كبير جدًا."
      );

    }


    /*
    ============================================
    إنشاء اتصال SMTP
    ============================================
    */

    const transporter =
      nodemailer.createTransport({

        host:
          SMTP_HOST.value(),

        port:
          Number(
            SMTP_PORT.value() || 465
          ),

        secure:
          String(
            SMTP_SECURE.value()
          ).toLowerCase() === "true",

        auth: {

          user:
            SMTP_USER.value(),

          pass:
            SMTP_PASS.value()

        },

        disableFileAccess:
          true,

        disableUrlAccess:
          true

      });


    /*
    ============================================
    إرسال البريد
    ============================================
    */

    await transporter.sendMail({

      from:
        MAIL_FROM.value(),

      to:
        to,

      subject:
        "Certificate of Participation – Menoufia Dental Congress",

      text:
        `Dear ${fullName || "Participant"},

Please find attached your Certificate of Participation in the 2nd Scientific Conference of the Faculty of Dentistry, Menoufia University.

Best regards,
Organizing Committee`,

      html:
        `
        <div style="font-family:Arial,sans-serif;line-height:1.7">

          <p>
            Dear ${escapeHtml(
              fullName || "Participant"
            )},
          </p>

          <p>
            Please find attached your Certificate of Participation
            in the 2nd Scientific Conference of the Faculty of Dentistry,
            Menoufia University.
          </p>

          <p>
            Best regards,<br>
            Organizing Committee
          </p>

        </div>
        `,

      attachments: [

        {

          filename:
            `Certificate-${certId}.pdf`,

          content:
            Buffer.from(
              pdfBase64,
              "base64"
            ),

          contentType:
            "application/pdf",

          contentDisposition:
            "attachment"

        }

      ]

    });


    /*
    ============================================
    نجاح
    ============================================
    */

    return {

      ok:
        true,

      message:
        `تم إرسال الشهادة إلى ${to}`

    };

  }
);


/*
============================================
حماية النص داخل HTML
============================================
*/

function escapeHtml(value) {

  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}
