import type { CotizacionDetalle } from "../types/cotizacion";

interface Props {
  cotizacion: CotizacionDetalle;
}

const LOGO_URL = "https://i.imgur.com/CdWX682.jpeg";

function money(value: string | number) {
  return `$ ${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fechaLarga(date: string) {
  const fecha = new Date(date);
  const meses = [
    "ENERO",
    "FEBRERO",
    "MARZO",
    "ABRIL",
    "MAYO",
    "JUNIO",
    "JULIO",
    "AGOSTO",
    "SEPTIEMBRE",
    "OCTUBRE",
    "NOVIEMBRE",
    "DICIEMBRE",
  ];

  return `San Salvador, ${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

export function CotizacionPrintTemplate({ cotizacion }: Props) {
  return (
    <div className="print-template">
      <style>
        {`
          @media screen {
            .print-template { display: none; }
          }

          @media print {
            @page {
              size: letter;
              margin: 15mm 20mm 15mm 20mm;
            }
            
            body { 
              margin: 0; 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            body * { visibility: hidden; }
            .print-template, .print-template * { visibility: visible; }
            
            .print-template {
              display: block;
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              font-family: 'Helvetica Neue', Arial, sans-serif;
              color: #333;
              font-size: 12.5px;
              line-height: 1.5;
            }

            .header-logo {
              display: flex;
              justify-content: center;
              align-items: center;
              text-align: center;
              margin-top: 0px;
              margin-bottom: 25px;
              width: 100%;
            }

            .header-logo img {
              max-width: 380px;
              height: auto;
              display: block;
              margin: 0 auto;
            }

            .fecha-contenedor {
              text-align: right;
              margin-bottom: 20px;
              color: #555;
            }

            .info-cliente {
              margin-bottom: 20px;
            }

            .info-cliente p {
              margin: 3px 0;
            }

            .seccion-titulo {
              font-size: 13.5px;
              font-weight: bold;
              margin-top: 20px;
              margin-bottom: 10px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 4px;
              color: #111;
            }

            .producto-item {
              margin-bottom: 12px;
              padding-left: 5px;
            }

            .page-break {
              break-before: page;
              page-break-before: always;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }

            th, td {
              border: 1px solid #bbb;
              padding: 7px 9px;
              font-size: 11.5px;
            }

            th {
              background-color: #f8f9fa;
              font-weight: bold;
              text-align: center;
              color: #111;
            }

            .right { text-align: right; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            
            .highlight { 
              color: #d4a373; 
              font-weight: bold; 
            }

            .firmas-container {
              display: flex;
              justify-content: space-between;
              margin-top: 35px;
              page-break-inside: avoid;
            }

            .firma-box {
              width: 45%;
            }

            .footer-info {
              text-align: center;
              margin-top: 45px;
              font-size: 11px;
              color: #666;
              border-top: 1px solid #eee;
              padding-top: 12px;
              line-height: 1.4;
              page-break-inside: avoid;
            }
          }
            .estado-cotizacion {
              margin: 10px 0 20px 0;
              padding: 8px 12px;
              border-radius: 6px;
              font-weight: bold;
              text-align: center;
              border: 1px solid #ddd;
            }

            .estado-pendiente {
              background-color: #fef3c7;
              color: #92400e;
              border-color: #fcd34d;
            }

            .estado-aprobada {
              background-color: #dcfce7;
              color: #166534;
              border-color: #86efac;
            }

            .estado-rechazada {
              background-color: #fee2e2;
              color: #991b1b;
              border-color: #fca5a5;
            }
        `}
      </style>

      <div className="header-logo">
        <img src={LOGO_URL} alt="Imperquimia" />
      </div>

      <div className="fecha-contenedor">{fechaLarga(cotizacion.updatedAt)}</div>

      <div className="info-cliente">
        <p>Señores</p>
        <p className="bold">{cotizacion.cliente}</p>
        <p>
          <span className="bold">PROYECTO:</span> {cotizacion.descripcion}
        </p>
      </div>

      <p style={{ marginBottom: "15px" }}>
        De acuerdo a su solicitud, nos complace ofertar la distribución y
        aplicación de los productos que detallamos a continuación.
      </p>

      <div className="seccion-titulo">PRODUCTOS A EMPLEAR</div>

      {cotizacion.detalles.map((detalle, index) => (
        <div key={detalle.id} className="producto-item">
          <p className="bold" style={{ margin: "0 0 2px 0" }}>
            {index + 1}. {detalle.material.nombre}
          </p>
          <p style={{ margin: 0, color: "555" }}>
            {detalle.material.descripcion ?? "Sin descripción"}
          </p>
        </div>
      ))}

      <div className="seccion-titulo center">COSTO</div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>DESCRIPCIÓN</th>
            <th>Cantidad</th>
            <th>Unid</th>
            <th>Costo Unitario ($)</th>
            <th>Subtotal ($)</th>
            <th>IVA ($)</th>
            <th>Total ($)</th>
          </tr>
        </thead>

        <tbody>
          {cotizacion.detalles.map((detalle, index) => (
            <tr key={detalle.id}>
              <td className="center">{index + 1}</td>
              <td>{detalle.material.nombre}</td>
              <td className="right">{Number(detalle.cantidad)}</td>
              <td className="center">{detalle.unidad}</td>
              <td className="right">{money(detalle.costoUnitario)}</td>
              <td className="right">{money(detalle.subTotal)}</td>
              <td className="right">{money(detalle.totalIva)}</td>
              <td className="right">{money(detalle.total)}</td>
            </tr>
          ))}

          <tr>
            <td colSpan={7} className="right bold">
              Sumas
            </td>
            <td className="right bold">{money(cotizacion.subTotal)}</td>
          </tr>

          <tr>
            <td colSpan={7} className="right bold">
              IVA 13%
            </td>
            <td className="right bold">{money(cotizacion.totalIva)}</td>
          </tr>

          <tr>
            <td colSpan={7} className="right bold">
              TOTAL
            </td>
            <td className="right bold">{money(cotizacion.total)}</td>
          </tr>
        </tbody>
      </table>

      <div className="page-break">
        <div className="seccion-titulo" style={{ marginTop: "0px" }}>
          NOTA
        </div>
        <p style={{ margin: "3px 0" }}>
          ➢ Esta cotización está sujeta a cambios.
        </p>
        <p style={{ margin: "3px 0" }}>
          ➢ Se remedirá al principio y/o final del trabajo.
        </p>
        <p style={{ margin: "3px 0" }}>
          ➢ Cualquier cambio repercutirá directamente en el costo de la
          aplicación.
        </p>
        <p style={{ margin: "3px 0" }}>➢ Oferta tiene vigencia de 15 días.</p>
        <p className="highlight" style={{ margin: "3px 0" }}>
          ➢ Cotización realizada sin visita técnica cualquier trabajo extra
          requerido en el área generar variación en el precio cotizado.
        </p>
        <p className="highlight" style={{ margin: "3px 0" }}>
          ➢ Se remedirá al final.
        </p>

        <div className="seccion-titulo">ALCANCE DEL TRABAJO</div>
        <p style={{ margin: "5px 0" }}>
          Todos los trabajos arriba descritos incluyen: mano de obra, materiales
          y equipo necesario para realizar un buen trabajo.
        </p>

        <div className="seccion-titulo">TIEMPO DE EJECUCIÓN</div>
        <p style={{ margin: "5px 0" }}>
          El tiempo de ejecución dependerá de la accesibilidad al área del
          trabajo y condiciones del clima, teniendo un estimado de 10 días para
          finalización y entrega de proyecto.
        </p>

        <div className="seccion-titulo">GARANTÍA</div>
        <p style={{ margin: "5px 0" }}>
          Impermeabilizantes y Químicos, S. A. de C. V. asegura que en sus
          trabajos de aplicación de productos impermeabilizantes no emplea
          material defectuoso, razón por la que garantizamos el trabajo antes
          descrito por el periodo de 5 años para todos los productos a aplicar.{" "}
          <span className="highlight">No aplica a daños por terceros.</span>
        </p>

        {cotizacion.estado === "PENDIENTE" && (
          <>
            <div className="seccion-titulo">APROBACIÓN DE LA OFERTA</div>

            <p
              style={{
                margin: "5px 0",
                color: "#b45309",
                fontWeight: "bold",
              }}
            >
              La presente cotización se encuentra pendiente de aprobación. Para
              aprobar la oferta, deberá realizarse el proceso correspondiente
              antes de iniciar la ejecución del proyecto.
            </p>
          </>
        )}

        {cotizacion.estado === "APROBADA" && (
          <>
            <div className="seccion-titulo">ESTADO DE LA OFERTA</div>

            <p
              style={{
                margin: "5px 0",
                color: "#15803d",
                fontWeight: "bold",
              }}
            >
              La presente cotización ha sido aprobada.
            </p>
          </>
        )}

        {cotizacion.estado === "RECHAZADA" && (
          <>
            <div className="seccion-titulo">ESTADO DE LA OFERTA</div>

            <p
              style={{
                margin: "5px 0",
                color: "#b91c1c",
                fontWeight: "bold",
              }}
            >
              La presente cotización ha sido rechazada y no continuará con el
              proceso de ejecución.
            </p>
          </>
        )}

        <div className="firmas-container">
          <div className="firma-box">
            <p style={{ margin: "0 0 15px 0" }}>Atentamente.</p>
            <br />
            <br />
            <p className="bold" style={{ margin: "0" }}>
              ALEJANDRO DEL PINAL
            </p>
            <p style={{ margin: "1px 0", color: "#555" }}>
              IMPERQUIMIA, S. A. DE C. V.
            </p>
            <p style={{ margin: "1px 0", color: "#555" }}>
              Telefax: + (503) 2263-8859 / 2264-5417
            </p>
          </div>

          <div className="firma-box center">
            <p style={{ margin: "0 0 15px 0" }}>Aprobado</p>
            <br />
            <br />
            <p style={{ margin: "0", color: "#bbb" }}>______________________</p>
            <p style={{ margin: "4px 0 0 0" }}>firma y sello.</p>
          </div>
        </div>

        <div className="footer-info">
          Av. Mejía Lara #11-76; Col. Campestre, San Salvador, El Salvador
          <br />
          Telefax: 2263-8859, 2264-5417 | e-mail: gimperquimia@gmail.com
        </div>
      </div>
    </div>
  );
}
