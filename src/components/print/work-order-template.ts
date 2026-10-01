// src/components/print/work-order-template.ts

export type WorkOrderPlanning = {
  id: string;
  orderId: string;
  machine: string;
  operatorId: string;
  operatorName: string;
  scheduledDate: string;
  status: string;
};

export type WorkOrderOrder = {
  id: string;
  orderCode?: string;
  customerName: string;
  product: string;
  quantity: number;
  deadline?: string;
};

const escapeHTML = (value: unknown) => {
  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export function generateWorkOrderHTML({
  planning,
  order,
}: {
  planning: WorkOrderPlanning;
  order: WorkOrderOrder;
}) {
  const orderCode =
    order.orderCode ||
    `SO-${planning.orderId.slice(0, 6).toUpperCase()}`;

  const status = planning.status || "planned";

  return `
<!DOCTYPE html>
<html lang="id">

<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>Work Order ${escapeHTML(orderCode)}</title>

  <style>

    @page {
      size: A4 portrait;
      margin: 15mm;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #111827;
      font-family:
        Arial,
        Helvetica,
        sans-serif;
    }

    body {
      width: 100%;
      font-size: 12px;
    }

    .page {
      width: 100%;
      min-height: 267mm;
      position: relative;
    }

    /* =========================
       HEADER
    ========================= */

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      padding-bottom: 15px;

      border-bottom: 2px solid #111827;
    }

    .brand {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .brand-subtitle {
      margin-top: 4px;
      font-size: 10px;
      color: #6b7280;
    }

    .document {
      text-align: right;
    }

    .document-title {
      font-size: 21px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .document-number {
      margin-top: 5px;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
    }

    /* =========================
       SECTION
    ========================= */

    .section {
      margin-top: 20px;
    }

    .section-title {
      padding: 8px 10px;

      background: #f3f4f6;

      border: 1px solid #d1d5db;
      border-bottom: none;

      font-size: 11px;
      font-weight: 700;

      letter-spacing: 0.7px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    td {
      border: 1px solid #d1d5db;
      padding: 9px 10px;

      font-size: 11px;
      vertical-align: middle;
    }

    .label {
      width: 30%;

      background: #fafafa;

      font-weight: 600;
      color: #4b5563;
    }

    .value {
      font-weight: 500;
      color: #111827;
    }

    /* =========================
       STATUS
    ========================= */

    .status {
      display: inline-block;

      padding: 5px 10px;

      border-radius: 20px;

      font-size: 10px;
      font-weight: 700;

      text-transform: uppercase;
    }

    .status-planned {
      background: #fef3c7;
      color: #b45309;
    }

    .status-running {
      background: #dbeafe;
      color: #2563eb;
    }

    .status-completed {
      background: #dcfce7;
      color: #15803d;
    }

    .status-cancelled {
      background: #fee2e2;
      color: #dc2626;
    }

    /* =========================
       PRODUCTION TABLE
    ========================= */

    .production-table {
      margin-top: 20px;
    }

    .production-highlight {
      font-size: 14px;
      font-weight: 700;
    }

    /* =========================
       NOTES
    ========================= */

    .notes {
      height: 80px;
      vertical-align: top;
    }

    /* =========================
       SIGNATURE
    ========================= */

    .signature-section {
      margin-top: 45px;

      display: flex;
      justify-content: space-between;

      gap: 50px;
    }

    .signature {
      width: 45%;

      text-align: center;
    }

    .signature-title {
      font-size: 11px;
      font-weight: 600;
    }

    .signature-space {
      height: 65px;
    }

    .signature-line {
      border-top: 1px solid #111827;

      padding-top: 6px;

      font-size: 11px;
    }

    /* =========================
       FOOTER
    ========================= */

    .footer {
      position: absolute;

      bottom: 0;
      left: 0;
      right: 0;

      padding-top: 10px;

      border-top: 1px solid #d1d5db;

      display: flex;
      justify-content: space-between;

      font-size: 9px;
      color: #9ca3af;
    }

    @media print {

      body {
        background: #ffffff;
      }

      .page {
        page-break-after: avoid;
      }

    }

  </style>
</head>

<body>

  <div class="page">

    <!-- HEADER -->

    <div class="header">

      <div>
        <div class="brand">
          RocketPrintz
        </div>

        <div class="brand-subtitle">
          Production Management System
        </div>
      </div>

      <div class="document">

        <div class="document-title">
          WORK ORDER
        </div>

        <div class="document-number">
          ${escapeHTML(orderCode)}
        </div>

      </div>

    </div>


    <!-- ORDER INFORMATION -->

    <div class="section">

      <div class="section-title">
        ORDER INFORMATION
      </div>

      <table>

        <tr>
          <td class="label">
            Order Code
          </td>

          <td class="value">
            ${escapeHTML(orderCode)}
          </td>
        </tr>

        <tr>
          <td class="label">
            Customer
          </td>

          <td class="value">
            ${escapeHTML(order.customerName)}
          </td>
        </tr>

        <tr>
          <td class="label">
            Product
          </td>

          <td class="value">
            ${escapeHTML(order.product)}
          </td>
        </tr>

        <tr>
          <td class="label">
            Quantity
          </td>

          <td class="value">
            ${escapeHTML(order.quantity)}
          </td>
        </tr>

        <tr>
          <td class="label">
            Order Deadline
          </td>

          <td class="value">
            ${escapeHTML(order.deadline || "-")}
          </td>
        </tr>

      </table>

    </div>


    <!-- PRODUCTION INFORMATION -->

    <div class="section">

      <div class="section-title">
        PRODUCTION INFORMATION
      </div>

      <table>

        <tr>
          <td class="label">
            Machine
          </td>

          <td class="value">
            <span class="production-highlight">
              ${escapeHTML(planning.machine)}
            </span>
          </td>
        </tr>

        <tr>
          <td class="label">
            Schedule Date
          </td>

          <td class="value">
            <span class="production-highlight">
              ${escapeHTML(planning.scheduledDate)}
            </span>
          </td>
        </tr>

        <tr>
          <td class="label">
            Operator
          </td>

          <td class="value">
            ${escapeHTML(planning.operatorName)}
          </td>
        </tr>

        <tr>
          <td class="label">
            Production Status
          </td>

          <td class="value">

            <span class="status status-${escapeHTML(status)}">
              ${escapeHTML(status)}
            </span>

          </td>
        </tr>

      </table>

    </div>


    <!-- PRODUCTION NOTES -->

    <div class="section">

      <div class="section-title">
        PRODUCTION NOTES
      </div>

      <table>

        <tr>
          <td class="notes"></td>
        </tr>

      </table>

    </div>


    <!-- SIGNATURE -->

    <div class="signature-section">

      <div class="signature">

        <div class="signature-title">
          Operator
        </div>

        <div class="signature-space"></div>

        <div class="signature-line">
          ${escapeHTML(planning.operatorName || "(................)")}
        </div>

      </div>


      <div class="signature">

        <div class="signature-title">
          Supervisor
        </div>

        <div class="signature-space"></div>

        <div class="signature-line">
          (................................)
        </div>

      </div>

    </div>


    <!-- FOOTER -->

    <div class="footer">

      <span>
        RocketPrintz
      </span>

      <span>
        Work Order — ${escapeHTML(orderCode)}
      </span>

    </div>

  </div>

</body>

</html>
  `;
}
