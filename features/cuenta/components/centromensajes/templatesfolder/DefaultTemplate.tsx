// app/cuenta/centro-mensajes/templates-page/lib/defaultTemplate.ts
export const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tu Pedido Está en Camino</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f0f4f8;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            text-align: center;
        }

        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 600px;
        }

        h1 {
            color: #333;
            font-size: 32px;
            margin-bottom: 20px;
            font-weight: bold;
        }

        p {
            font-size: 18px;
            color: #666;
            margin-bottom: 20px;
        }

        .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #888;
        }

        .footer a {
            text-decoration: none;
            color: #3498db;
        }

        /* Estilo para el logo en la parte superior */
        .logo {
            font-size: 36px;
            font-weight: bold;
            color: #3498db;
            margin-bottom: 20px;
        }

        /* Pie de página con una línea */
        .footer-line {
            border-top: 1px solid #ddd;
            margin-top: 20px;
            padding-top: 10px;
        }
    </style>
</head>
<body>

    <div class="container">
        <!-- Logo de la empresa -->
        <div class="logo">Mimbral 360</div>

        <!-- Mensaje principal -->
        <h1>Tu pedido está en camino!</h1>
        <p>Lo recibirás muy pronto!</p>

        <!-- Pie de página -->
        <div class="footer">
            <p><a href="" target="_blank">Mimbral.cl</a></p>
            <div class="footer-line">
                <p>Copyright &copy; 2025</p>
                <p>San Javier de Loncomilla, Región del Maule, Chile</p>
            </div>
        </div>
    </div>

</body>
</html>`;

export const SAMPLE_DATA = JSON.stringify(
    {
        id: "1",
        subject: "[QA] Export files for the entity {{entity}}",
        code: "export",
        smtp_config_name: "-",
        user_created: {
            initials: "MV",
            name: "Manuel Vilches",
            email: "manuel@fizzmod.com",
        },
        date_created: "17/11/2021 08:29",
        user_modified: {
            initials: "MV",
            name: "Manuel Vilches",
            email: "manuel@fizzmod.com",
        },
        date_modified: "17/11/2021 08:29",
        status: "Activo",
        destinatario: "Juan Hapes",
        asunto: "Asunto de prueba",
        responder_a: "Manuel Vilches",
        entity: "orders",
        nombre: "Felipe",
    },
    null,
    2
);