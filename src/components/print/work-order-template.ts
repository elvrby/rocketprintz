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

const getStatusLabel = (status: string) => {
  switch (status) {
    case "planned":
      return "Terjadwal";

    case "running":
      return "Sedang Diproduksi";

    case "completed":
      return "Selesai";

    case "cancelled":
      return "Dibatalkan";

    default:
      return status;
  }
};

const getStatusClass = (status: string) => {
  switch (status) {
    case "planned":
      return "status-planned";

    case "running":
      return "status-running";

    case "completed":
      return "status-completed";

    case "cancelled":
      return "status-cancelled";

    default:
      return "status-default";
  }
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

  const statusLabel = getStatusLabel(status);
  const statusClass = getStatusClass(status);

  return `
<!DOCTYPE html>

<html lang="id">

<head>

  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>Work Order - ${escapeHTML(orderCode)}</title>

  <style>

    @page {
      size: A4 portrait;
      margin: 12mm;
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
      font-size: 11px;
      line-height: 1.45;
    }

    .page {
      width: 100%;
      min-height: 273mm;

      position: relative;

      padding-bottom: 18mm;
    }


    /* =========================================
       HEADER
    ========================================= */

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      padding-bottom: 14px;

      border-bottom: 3px solid #111827;
    }

    .brand-wrapper {
      display: flex;
      align-items: center;

      gap: 10px;
    }

    .brand-icon {
      width: 38px;
      height: 38px;

      display: flex;
      align-items: center;
      justify-content: center;

      background: #111827;
      color: #ffffff;

      border-radius: 7px;

      font-size: 19px;
      font-weight: 700;
    }

    .brand {
      font-size: 22px;
      font-weight: 800;

      letter-spacing: -0.7px;

      color: #111827;
    }

    .brand-subtitle {
      margin-top: 2px;

      font-size: 9px;

      color: #6b7280;

      letter-spacing: 0.2px;
    }

    .document {
      text-align: right;
    }

    .document-label {
      font-size: 9px;

      color: #6b7280;

      text-transform: uppercase;

      letter-spacing: 1px;

      font-weight: 700;
    }

    .document-title {
      margin-top: 2px;

      font-size: 20px;

      font-weight: 800;

      letter-spacing: 0.4px;

      color: #111827;
    }

    .document-number {
      margin-top: 4px;

      padding: 5px 9px;

      display: inline-block;

      background: #f3f4f6;

      border: 1px solid #d1d5db;

      border-radius: 5px;

      font-size: 11px;

      font-weight: 700;

      color: #374151;
    }


    /* =========================================
       SECTION
    ========================================= */

    .section {
      margin-top: 17px;
    }

    .section-header {
      display: flex;

      align-items: center;

      gap: 8px;

      margin-bottom: 7px;
    }

    .section-number {
      width: 22px;
      height: 22px;

      display: flex;

      align-items: center;
      justify-content: center;

      background: #111827;

      color: #ffffff;

      border-radius: 4px;

      font-size: 9px;

      font-weight: 700;
    }

    .section-title {
      font-size: 11px;

      font-weight: 800;

      color: #111827;

      letter-spacing: 0.6px;

      text-transform: uppercase;
    }

    .section-line {
      flex: 1;

      height: 1px;

      background: #e5e7eb;
    }


    /* =========================================
       TABLE
    ========================================= */

    table {
      width: 100%;

      border-collapse: separate;

      border-spacing: 0;

      overflow: hidden;

      border: 1px solid #d1d5db;

      border-radius: 5px;
    }

    td {
      padding: 8px 10px;

      border-bottom: 1px solid #e5e7eb;

      font-size: 10.5px;

      vertical-align: middle;
    }

    tr:last-child td {
      border-bottom: none;
    }

    .label {
      width: 32%;

      background: #f9fafb;

      color: #6b7280;

      font-weight: 600;
    }

    .value {
      color: #111827;

      font-weight: 600;
    }


    /* =========================================
       ORDER CODE
    ========================================= */

    .order-code {
      font-size: 13px;

      font-weight: 800;

      letter-spacing: 0.3px;
    }


    /* =========================================
       QUANTITY
    ========================================= */

    .quantity {
      font-size: 14px;

      font-weight: 800;
    }


    /* =========================================
       PRODUCTION HIGHLIGHT
    ========================================= */

    .production-grid {
      display: grid;

      grid-template-columns: 1fr 1fr;

      gap: 8px;
    }

    .production-card {
      border: 1px solid #d1d5db;

      border-radius: 5px;

      padding: 10px;

      background: #ffffff;
    }

    .production-card-label {
      font-size: 8px;

      color: #6b7280;

      text-transform: uppercase;

      letter-spacing: 0.7px;

      font-weight: 700;

      margin-bottom: 4px;
    }

    .production-card-value {
      font-size: 13px;

      font-weight: 800;

      color: #111827;
    }

    .production-card.full {
      grid-column: span 2;
    }


    /* =========================================
       STATUS
    ========================================= */

    .status {
      display: inline-block;

      padding: 4px 10px;

      border-radius: 20px;

      font-size: 9px;

      font-weight: 800;

      text-transform: uppercase;

      letter-spacing: 0.4px;
    }

    .status-planned {
      background: #fef3c7;

      color: #92400e;

      border: 1px solid #fcd34d;
    }

    .status-running {
      background: #dbeafe;

      color: #1d4ed8;

      border: 1px solid #93c5fd;
    }

    .status-completed {
      background: #dcfce7;

      color: #166534;

      border: 1px solid #86efac;
    }

    .status-cancelled {
      background: #fee2e2;

      color: #b91c1c;

      border: 1px solid #fca5a5;
    }

    .status-default {
      background: #f3f4f6;

      color: #374151;

      border: 1px solid #d1d5db;
    }


    /* =========================================
       CATATAN PRODUKSI
    ========================================= */

    .notes-table {
      height: 92px;
    }

    .notes {
      height: 92px;

      vertical-align: top;

      position: relative;
    }

    .notes-placeholder {
      color: #9ca3af;

      font-size: 9px;

      font-style: italic;
    }

    .notes-lines {
      margin-top: 18px;
    }

    .notes-line {
      height: 19px;

      border-bottom: 1px dashed #d1d5db;
    }


    /* =========================================
       CHECKLIST
    ========================================= */

    .checklist {
      margin-top: 10px;

      display: grid;

      grid-template-columns:
        repeat(3, 1fr);

      gap: 8px;
    }

    .check-item {
      padding: 8px;

      border: 1px solid #d1d5db;

      border-radius: 5px;

      font-size: 9px;

      color: #374151;

      background: #ffffff;
    }

    .check-box {
      display: inline-block;

      width: 11px;
      height: 11px;

      border: 1px solid #6b7280;

      margin-right: 5px;

      vertical-align: -2px;
    }


    /* =========================================
       SIGNATURE
    ========================================= */

    .signature-section {
      margin-top: 25px;

      display: grid;

      grid-template-columns: 1fr 1fr;

      gap: 45px;
    }

    .signature {
      text-align: center;
    }

    .signature-title {
      font-size: 10px;

      font-weight: 700;

      color: #374151;
    }

    .signature-space {
      height: 58px;
    }

    .signature-line {
      border-top: 1px solid #111827;

      padding-top: 5px;

      font-size: 9px;

      font-weight: 600;

      color: #374151;
    }


    /* =========================================
       FOOTER
    ========================================= */

    .footer {
      position: absolute;

      bottom: 0;

      left: 0;

      right: 0;

      padding-top: 8px;

      border-top: 1px solid #d1d5db;

      display: flex;

      justify-content: space-between;

      align-items: center;

      font-size: 8px;

      color: #9ca3af;
    }

    .footer-left {
      font-weight: 700;

      color: #6b7280;
    }


    /* =========================================
       PRINT
    ========================================= */

    @media print {

      html,
      body {
        width: 210mm;
        min-height: 297mm;

        background: #ffffff;
      }

      .page {
        min-height: 273mm;

        page-break-after: avoid;
      }

      table,
      .production-card,
      .check-item {
        break-inside: avoid;
      }

    }

  </style>

</head>


<body>

  <div class="page">


    <!-- =====================================
         HEADER
    ====================================== -->

    <div class="header">

      <div class="brand-wrapper">

        <div class="brand-icon">
          RP
        </div>

        <div>

          <div class="brand">
            RocketPrintz
          </div>

          <div class="brand-subtitle">
            Sistem Manajemen Produksi Percetakan
          </div>

        </div>

      </div>


      <div class="document">

        <div class="document-label">
          Dokumen Produksi
        </div>

        <div class="document-title">
          WORK ORDER
        </div>

        <div class="document-number">
          ${escapeHTML(orderCode)}
        </div>

      </div>

    </div>



    <!-- =====================================
         INFORMASI PESANAN
    ====================================== -->

    <div class="section">

      <div class="section-header">

        <div class="section-number">
          01
        </div>

        <div class="section-title">
          Informasi Pesanan
        </div>

        <div class="section-line"></div>

      </div>


      <table>

        <tr>

          <td class="label">
            Kode Pesanan
          </td>

          <td class="value">

            <span class="order-code">
              ${escapeHTML(orderCode)}
            </span>

          </td>

        </tr>


        <tr>

          <td class="label">
            Nama Pelanggan
          </td>

          <td class="value">
            ${escapeHTML(order.customerName)}
          </td>

        </tr>


        <tr>

          <td class="label">
            Produk
          </td>

          <td class="value">
            ${escapeHTML(order.product)}
          </td>

        </tr>


        <tr>

          <td class="label">
            Jumlah Pesanan
          </td>

          <td class="value">

            <span class="quantity">
              ${escapeHTML(order.quantity)}
            </span>

            unit

          </td>

        </tr>


        <tr>

          <td class="label">
            Batas Waktu Pesanan
          </td>

          <td class="value">
            ${escapeHTML(order.deadline || "-")}
          </td>

        </tr>

      </table>

    </div>



    <!-- =====================================
         INFORMASI PRODUKSI
    ====================================== -->

    <div class="section">

      <div class="section-header">

        <div class="section-number">
          02
        </div>

        <div class="section-title">
          Informasi Produksi
        </div>

        <div class="section-line"></div>

      </div>


      <div class="production-grid">


        <div class="production-card">

          <div class="production-card-label">
            Mesin Produksi
          </div>

          <div class="production-card-value">
            ${escapeHTML(planning.machine)}
          </div>

        </div>


        <div class="production-card">

          <div class="production-card-label">
            Tanggal Produksi
          </div>

          <div class="production-card-value">
            ${escapeHTML(planning.scheduledDate)}
          </div>

        </div>


        <div class="production-card">

          <div class="production-card-label">
            Operator
          </div>

          <div class="production-card-value">
            ${escapeHTML(planning.operatorName)}
          </div>

        </div>


        <div class="production-card">

          <div class="production-card-label">
            Status Produksi
          </div>

          <div class="production-card-value">

            <span class="status ${statusClass}">
              ${escapeHTML(statusLabel)}
            </span>

          </div>

        </div>

      </div>

    </div>



    <!-- =====================================
         CATATAN PRODUKSI
    ====================================== -->

    <div class="section">

      <div class="section-header">

        <div class="section-number">
          03
        </div>

        <div class="section-title">
          Catatan Produksi
        </div>

        <div class="section-line"></div>

      </div>


      <table class="notes-table">

        <tr>

          <td class="notes">

            <div class="notes-placeholder">
              Catatan, kendala, atau informasi tambahan selama proses produksi:
            </div>

            <div class="notes-lines">

              <div class="notes-line"></div>

              <div class="notes-line"></div>

              <div class="notes-line"></div>

            </div>

          </td>

        </tr>

      </table>


      <div class="checklist">

        <div class="check-item">
          <span class="check-box"></span>
          Mesin siap digunakan
        </div>

        <div class="check-item">
          <span class="check-box"></span>
          Material tersedia
        </div>

        <div class="check-item">
          <span class="check-box"></span>
          Hasil produksi diperiksa
        </div>

      </div>

    </div>



    <!-- =====================================
         TANDA TANGAN
    ====================================== -->

    <div class="section">

      <div class="section-header">

        <div class="section-number">
          04
        </div>

        <div class="section-title">
          Persetujuan Produksi
        </div>

        <div class="section-line"></div>

      </div>


      <div class="signature-section">


        <div class="signature">

          <div class="signature-title">
            Operator Produksi
          </div>

          <div class="signature-space"></div>

          <div class="signature-line">
            ${escapeHTML(
              planning.operatorName || "(............................)"
            )}
          </div>

        </div>


        <div class="signature">

          <div class="signature-title">
            Supervisor
          </div>

          <div class="signature-space"></div>

          <div class="signature-line">
            (........................................)
          </div>

        </div>


      </div>

    </div>



    <!-- =====================================
         FOOTER
    ====================================== -->

    <div class="footer">

      <div class="footer-left">
        RocketPrintz
      </div>

      <div>
        Dokumen Work Order Produksi
      </div>

      <div>
        ${escapeHTML(orderCode)}
      </div>

    </div>


  </div>

</body>

</html>
  `;
}
