# Mapeo de preguntas de Redes a la teoría

Generado a partir de `scripts/rank-sources.mjs` (candidatos por BM25 sobre el texto de `pdftotext`) y revisión
manual página por página. **Pendiente de revisión humana.**

- Total: **98** preguntas · con `source`: **90** (high 51, medium 22, low 17) · sin `source`: **8**
- Número de página = página física del PDF (1-based), la que usa `#page=N`.
- Cada fragmento fue verificado automáticamente contra el texto extraído de esa página (salvo espacios y viñetas).
- 🖼 = la evidencia está en una imagen o diagrama de la diapositiva (renderizada y revisada a ojo); el fragmento es solo el título.
- Cuando el mismo fragmento aparece en otro PDF (los apuntes repiten diapositivas), se prioriza `u2-2025.pdf` (edición 2025)
  para la capa de enlace y `u1-frame-relay-atm.pdf` para Frame Relay/ATM, y se lista el resto en «También en».

### Criterio de confianza
| Confianza | Significado |
|---|---|
| high | La página contiene los términos específicos de la respuesta correcta. |
| medium | La página trata el tema explícitamente, pero la respuesta aparece parcial, parafraseada o solo en una imagen. |
| low | Solo coincide el tema: es la mejor página disponible, pero no respalda la respuesta puntual. |
| — | Sin coincidencia clara: no se asigna `source`. |

## Asignaciones

| id | Enunciado | Página | Confianza | Fragmento que lo justifica | Observaciones | También en |
|---|---|---|---|---|---|---|
| `redes-c61` | ¿Cual es la ventaja del diseño de redes en capas o pilas? | `u1-introduccion.pdf` p. 1 | medium | «Para reducir la complejidad del diseño, se organizan las redes en pilas de capas o niveles, cuyo propósito es ofrecer ciertos servicios a capas superiores, ocultando o abstrayendo los detalles de implementación del servicio ofrecido.» | Respalda «reducir la complejidad» y «abstraer»; no menciona el desarrollo o la modificación independiente de cada capa. |  |
| `redes-m10` | Defina lo siguiente escogiendo la opción correcta: | `u1-introduccion.pdf` p. 1 | low | «ofrecer ciertos servicios a capas superiores» | No hay definición formal de protocolo ni de servicio; solo alude a que una capa ofrece servicios a la superior. |  |
| `redes-m18` | Seleccione las respuestas correctas para definir cada componente | `u1-introduccion.pdf` p. 2 | high | «Unidad de datos de la Interfaz: consiste de dos partes, la SDU o unidad de datos de servicio y la ICI o información de control de la interfaz.» |  |  |
| `redes-c8` | El control de flujo refiere a: | `u2-2025.pdf` p. 11 | high | «Problema: Tx rapido → Rx lento» |  | u1-enlace.pdf p.10 |
| `redes-c10` | Los enlaces pueden ser: (marque las opciones correctas) | `u2-2025.pdf` p. 48 | medium | «existen dos categorías de redes, las redes punto a punto y las redes de difusión» | Habla de categorías de redes, no de enlaces. |  |
| `redes-c20` | ¿Cual de los siguientes procedimientos se relacionan con el control de errores? | `u2-2025.pdf` p. 17 | high | «ARQ con Parada-y-Espera ARQ con Go-Back-N ARQ con Selective Repeat» |  | u1-enlace.pdf p.16 |
| `redes-c47` | ¿Cual de los siguientes procedimientos se relacionan con el control de flujo? | `u2-2025.pdf` p. 15 | high | «CONTROL DE FLUJO Ventanas deslizantes» | Parada-y-espera bajo «Control de flujo» está en la p. 13. | u1-enlace.pdf p.14, u1-enlace.pdf p.15, u2-2025.pdf p.16 |
| `redes-m1` | Rendimiento de protocolos ARQ con Selective Repeat: | `u2-2025.pdf` p. 27 | high | «ARQ con Selective Repeat Siguiendo el razonamiento anterior, con errores la formula seria 1-P si W >= 2a+1» |  |  |
| `redes-m11` | Rendimiento de protocolos ARQ parada y espera con errores: | `u2-2025.pdf` p. 26 | high | «Reemplazando en la formula original, tenemos U= 1-P» | La fórmula completa es U = (1-P)/(1+2a); el denominador queda en otra línea del texto extraído. | u1-enlace.pdf p.25 |
| `redes-m13` | El rendimiento de un protocolo utilizando control de flujo con ventana deslizante y sin… | `u2-2025.pdf` p. 25 | high | «Ventana Deslizante: 1 si W >= 2a+1 si W < 2a+1» |  | u1-enlace.pdf p.24 |
| `redes-m21` | Rendimiento de protocolos ARQ con Go-Back-N: | `u2-2025.pdf` p. 28 | high | «ARQ con Go-Back-N Finalmente, para Go-Back-N la formula es 1-P si W >= 2a+1» |  |  |
| `redes-c13` | PPP se creo para reemplazar a SLIP y LAPB | `u2-2025.pdf` p. 39 | low | «IETF RFC 1661, 1662, 1663» | Es la diapositiva de introducción a PPP; no dice que PPP reemplazó a SLIP y LAPB. | u1-enlace.pdf p.45 |
| `redes-c14` | El Protocolo LAP B es similar a HDLC salvo que no utiliza direccionamiento | `u2-2025.pdf` p. 35 | high | 🖼 «LAPB» | Diapositiva «Resumen» de LAPB: tilde en entramado, control de errores y control de flujo; cruz en Direccionamiento (se ve en la imagen, no en el texto). Ver también p. 34: «Derivado de HDLC». |  |
| `redes-c22` | Cual de las siguientes opciones son válidas para HDLC | `u2-2025.pdf` p. 30 | high | «Tres modos de operación: respuesta normal, respuesta asincrónica, balanceado asincrónico» |  | u1-enlace.pdf p.30 |
| `redes-c23` | PPP opera en la capa de enlace | `u2-2025.pdf` p. 39 | low | «Subprotocolos separados para gestión del enlace» | El apunte trata PPP dentro de la capa de enlace, pero la página no lo afirma explícitamente. | u1-enlace.pdf p.45 |
| `redes-c28` | SLIP es un protocolo de enlace extremadamente elemental que apenas cumple con la funció… | `u2-2025.pdf` p. 38 | high | 🖼 «SLIP» | Diapositiva «Resumen» de SLIP: solo «Entramado y encapsulamiento» (con «?»); cruz en control de errores, control de flujo y direccionamiento (se ve en la imagen). |  |
| `redes-c30` | Cómo se negocian las opciones de protocolos de red en PPP? | `u2-2025.pdf` p. 39 | high | «Subprotocolos separados para gestión del enlace y de las opciones de capa de red (LCP y NCP)» |  | u1-enlace.pdf p.45 |
| `redes-c34` | Cual de las siguientes afirmaciones son verdaderas para el protocolo PPP | `u2-2025.pdf` p. 39 | high | «Negociación dinámica de una dirección de capa 3 (IP)» |  | u1-enlace.pdf p.45 |
| `redes-c44` | Cómo se inician las sesiones PPP? | `u2-2025.pdf` p. 39 | medium | «Subprotocolos separados para gestión del enlace y de las opciones de capa de red (LCP y NCP)» | LCP gestiona el enlace. La tabla de mensajes LCP (Configure-Request, etc.) está como imagen en la p. 43. | u1-enlace.pdf p.45 |
| `redes-c49` | El protocolo PPP, tiene las siguientes funciones de capa de enlace | `u2-2025.pdf` p. 45 | high | 🖼 «Resumen» | Diapositiva «Resumen» de PPP: tilde en entramado y encapsulamiento y en control de errores; cruz en control de flujo y direccionamiento (se ve en la imagen). |  |
| `redes-c53` | El protocolo PPP incluye las funciones de control de flujo y direccionamiento | `u2-2025.pdf` p. 45 | high | 🖼 «Resumen» | Diapositiva «Resumen» de PPP: cruz en control de flujo y en direccionamiento (se ve en la imagen). |  |
| `redes-m4` | PPP es: | `u2-2025.pdf` p. 39 | medium | «Autenticación Compresión Multienlace» | Respalda autenticación, compresión y multiprotocolo. El escenario con el proveedor de Internet (dial-up) está como imagen en la p. 40. | u1-enlace.pdf p.45 |
| `redes-m7` | Numere las cinco fases de una conexión PPP | `u2-2025.pdf` p. 42 | medium | 🖼 (diapositiva sin texto) | Diagrama de estados de PPP (solo imagen): Dead → Establish → Authenticate → Network → Open → Terminate. Muestra las fases, pero no las numera como la pregunta. |  |
| `redes-c32` | Una cuestión central en los canales de difusión es el problema de asignación del canal … | `u2-2025.pdf` p. 48 | high | «existen protocolos que operan en una subcapa de la capa de enlace llamada subcapa MAC» |  |  |
| `redes-c36` | Esta expresión representa el rendimiento de Aloha puro: S = G·e^(−2G) | `u2-2025.pdf` p. 51 | low | 🖼 «RENDIMIENTO» | Gráfico de rendimiento S vs G con la curva de Pure ALOHA (imagen); la fórmula no aparece en el apunte. |  |
| `redes-c46` | Esta expresión representa el rendimiento de Aloha ranurado: S = G·e^(−G) | `u2-2025.pdf` p. 51 | low | 🖼 «RENDIMIENTO» | Gráfico de rendimiento S vs G con la curva de Slotted ALOHA (imagen); la fórmula no aparece en el apunte. |  |
| `redes-m9` | Para protocolos que utilizan CSMA, con respecto de la latencia: | `u2-2025.pdf` p. 50 | medium | «Inconveniente: introduce una mayor latencia.» | Describe no-persistente y p-persistente («en situaciones de congestión evita el efecto de cola de espera»); la p. 51 plantea «¿Qué pasa con la latencia?» sobre el gráfico. |  |
| `redes-m17` | Los protocolos CSMA (Carrier Sense Multiple Access) pueden ser: | `u2-2025.pdf` p. 50 | high | «La persistencia de este tipo requiere un canal ranurado.» |  |  |
| `redes-m22` | El rendimiento máximo de: | `u2-2025.pdf` p. 51 | medium | 🖼 «RENDIMIENTO» | En el gráfico (imagen) el máximo de Pure ALOHA es ≈0,18 (G=0,5) y el de Slotted ALOHA ≈0,37 (G=1). |  |
| `redes-c2` | Cual es la longitud máxima del campo payload de la trama Ethernet | `u2-2025.pdf` p. 61 | high | «Longitud máxima: 1500+ bytes» |  |  |
| `redes-c4` | Cual es la longitud mínima de la trama Ethernet | `u2-2025.pdf` p. 61 | high | «Respuesta: 64 bytes» |  |  |
| `redes-c12` | Seleccione las opciones correctas para Gigabit Ethernet | `u2-2025.pdf` p. 75 | high | «Aunque la mayoría de las implementaciones son enlaces PaP FD» |  |  |
| `redes-c17` | La deteccion de colisiones es un proceso analógico Por que motivo puede ser dañino para… | `u2-2025.pdf` p. 61 | medium | «Colisiones. Detección (proceso ANALOGICO!)» | No enumera las causas (ruido, conexiones, longitud). |  |
| `redes-c21` | Cual es el único servivio que presta LLC | `u2-2025.pdf` p. 67 | high | «sólo se utilizan tramas LLC tipo 1 SC/NC (tramas UI)» |  |  |
| `redes-c35` | Que empresa desarrolló la primer version d Ethernet | `u2-2025.pdf` p. 60 | high | «Desarrollado por Xerox en PARC en los años ´70 (Ethernet_I)» |  |  |
| `redes-c50` | Seleccione las opciones correctas para Fast Ethernet | `u2-2025.pdf` p. 73 | high | «Soporte de autodetección de configuración mediante FLP – Fast Link» |  |  |
| `redes-c60` | LLC : | `u2-2025.pdf` p. 67 | high | «Entrega la PDU a la subcapa MAC para su transmisión» |  |  |
| `redes-c65` | La capacidad de conmutación de un switch se mide en: | `u2-2025.pdf` p. 130 | high | «6,5 Mpps (millones de paquetes por seg.)» |  |  |
| `redes-c66` | Ante una conexión redundante es preferible una perdida de conectividad temporal a que s… | `u2-2025.pdf` p. 125 | medium | «Este procedimiento evita bloquear la red de entrada si existe algún bucle.» | Los puertos arrancan bloqueados y tardan 10-20 s: se prefiere esperar a arriesgar bucles. |  |
| `redes-c67` | Los modos de operación de un switch pueden ser: | `u2-2025.pdf` p. 129 | high | «Cut-Throught o Fragment-Free (primeros 64 bytes)» |  |  |
| `redes-c68` | Seleccione de entre las siguientes opciones las que sean correctas para un switch | `u2-2025.pdf` p. 143 | high | «Eliminación escucha promiscua» |  |  |
| `redes-c69` | Cuando se produce un cambio en la topologóa se debe esperar: | `u2-2025.pdf` p. 125 | low | «tarda unos 10-20 segundos en empezar a funcionar» | No figura FORWARD_DELAY (15 s); solo la espera al conectar una interfaz. |  |
| `redes-c70` | Indique cual de las siguientes afirmaciones son verdaderas para los bridges | `u2-2025.pdf` p. 107 | low | «Los bridges transparentes fueron desarrollados originalmente por DEC» | Introducción a bridges transparentes; no lista las ventajas y desventajas de la pregunta. |  |
| `redes-c71` | Que compromete mas la performance de un switch trabajando en modo fragment free? | `u2-2025.pdf` p. 136 | medium | «espera a haber recibido 64 bytes» | Se deduce que muchas tramas mínimas son el peor caso; no se afirma explícitamente. |  |
| `redes-m2` | Las tramas Ethernet II y 802.3 difieren en: | `u2-2025.pdf` p. 60 | low | «Adoptado en 1983 por la IEEE (802.x) y Novell, con modificaciones al formato de trama original» | No detalla los campos TYPE y LEN. |  |
| `redes-m19` | Complete las siguientes definiciones | `u2-2025.pdf` p. 61 | medium | «Runts Giants Jabberings» | Nombra los errores pero no los define. |  |
| `redes-m20` | En una trama Ethernet: | `u2-2025.pdf` p. 61 | medium | «Direcciones físicas de 6 bytes = 48 bits» | No las llama «MAC» en esta página. |  |
| `redes-m23` | Ajustes finos del bridge | `u2-2025.pdf` p. 118 | medium | «se envían a una dirección multicast reservada» | La prioridad del puente raíz está en la p. 127. |  |
| `redes-m24` | Bridge - Ajustes finos - Temporización | `u2-2025.pdf` p. 118 | low | «La información se envía regularmente» | No figuran HELLO_TIME ni MAX_AGE. |  |
| `redes-c5` | El protocolo MACAW difiere de MACA en incorporar ACK | `u2-2025.pdf` p. 55 | high | «MACAW (1994) + ACK» |  |  |
| `redes-c25` | ¿Cuantos campos de direcciones tiene una trama 802.11? | `u2-2025.pdf` p. 90 | high | 🖼 «Trama 802.11» | Formato de trama (imagen) con 4 campos de dirección: destino (DA), fuente (SA), receptor (RA) y transmisor (TA). |  |
| `redes-c27` | Seleccione las opciones válidas para el protocolo WPA | `u2-2025.pdf` p. 99 | medium | «Lo más habitual en una red WiFi doméstica con seguridad WPA es que la autenticación se base en PSK» | Respalda PSK y que WPA surge para corregir WEP; no menciona RADIUS, MIC, RC4 ni la regeneración de claves. |  |
| `redes-c29` | Marque las opciones correctas para un escenario con protocolos de acceso inalambrico | `u2-2025.pdf` p. 52 | high | «Por eso no podemos usar CDMA: Interferencia en el receptor llevan a la destrucción de la trama» |  |  |
| `redes-c51` | Los protocolos MACA (Media Acces Colision Avoid) utilizan mensajes RTS (Ready to Send) … | `u2-2025.pdf` p. 55 | high | «comportamiento (transmitir/no transmitir) de cada estación ante un RTS/CTS» |  |  |
| `redes-m0` | El estándar 802.11 define: | `u2-2025.pdf` p. 84 | high | «MAC: implementa CSMA/CA, basado en MACAW» |  |  |
| `redes-m8` | El estándar 802.11 implementa: | `u2-2025.pdf` p. 85 | high | «Control: DCF (ad-hoc) y PCF (infraestructura)» |  |  |
| `redes-m12` | En el estándar 802.11: | `u2-2025.pdf` p. 88 | high | «Puede coexistir con DCF mediante IFS (Inter-Frame Space)» |  |  |
| `redes-c6` | ¿Cual es el mecanismo que utiliza ATM para acomodar el trafico de acuerdo a su tipo / f… | `u1-frame-relay-atm.pdf` p. 10 | medium | 🖼 «PRINCIPIOS DE FUNCIONAMIENTO» | Diagrama (imagen): servicios → protocolos de servicio específico → SDU → protocolos AAL / capa de adaptación ATM. Los tipos de AAL están en la p. 15. | u1-frame-relay-atm.pdf p.7, u1-frame-relay-atm.pdf p.8, u1-frame-relay-atm.pdf p.9, u1-introduccion.pdf p.16, u1-introduccion.pdf p.17, u1-introduccion.pdf p.18, u1-introduccion.pdf p.19 |
| `redes-c7` | ¿Cual de las siguientes opciones son válidas para Frame Relay? | `u1-frame-relay-atm.pdf` p. 1 | high | «Rangos de velocidad desde fraccionales T1 (ej. 64 Kbps, 128 Kbps) hasta OC-3 (155 Mbps)» |  | u1-introduccion.pdf p.10 |
| `redes-c9` | ¿A que nivel e produce la conmutación en Frame Relay? | `u1-frame-relay-atm.pdf` p. 1 | low | «Surge como una evolución natural de X.25» | No dice explícitamente en qué capa conmuta. | u1-introduccion.pdf p.10 |
| `redes-c11` | En un enlace Frame Relay un cliente puede transmitir a la velocidad del enlace tramas d… | `u1-frame-relay-atm.pdf` p. 5 | high | «Durante Tc, el cliente puede enviar todas las tramas CIR, y aquellas EIR que no superen la velocidad del enlace.» |  | u1-introduccion.pdf p.14 |
| `redes-c15` | ¿Que hace Frame Relay cuando recibe una trama dañada? | `u1-frame-relay-atm.pdf` p. 1 | low | «Líneas digitales de alta velocidad, prácticamente libres de errores» | No dice qué pasa con una trama dañada. | u1-introduccion.pdf p.10 |
| `redes-c16` | ATM define tipos de trafico como: | `u1-frame-relay-atm.pdf` p. 15 | high | «DISTINTOS TIPOS DE TRAFICO» |  | u1-introduccion.pdf p.24 |
| `redes-c18` | ATM puede conmutar / multiplexar en función de: | `u1-frame-relay-atm.pdf` p. 12 | high | «Las conmutaciones se pueden realizar por cualquiera de los campos (VPI/VCI)» |  | u1-introduccion.pdf p.21 |
| `redes-c19` | Debido a que son muy parecidas AAL3 y AAL4 se convirtieron en una única AAL 3/4 | `u1-frame-relay-atm.pdf` p. 15 | high | «AAL3 y AAL4 → AAL3/4» |  | u1-introduccion.pdf p.24 |
| `redes-c33` | ¿Cuales son los parámetros bajo los cuales un cliente contrata un enlace Frame Relay? | `u1-frame-relay-atm.pdf` p. 5 | high | «El cliente contrata un enlace sujeto a determinados parámetros Bc y Be» |  | u1-introduccion.pdf p.14 |
| `redes-c38` | ¿Cuales son las categorías de servicio de ATM? | `u1-frame-relay-atm.pdf` p. 16 | high | 🖼 «CATEGORIAS DE SERVICIO» | Gráfico (imagen) con las categorías CBR, VBR, ABR y UBR. | u1-introduccion.pdf p.25 |
| `redes-c39` | ¿En función de cual campo de su cabecera conmuta Frame Relay? | `u1-frame-relay-atm.pdf` p. 2 | medium | 🖼 «FRAME RELAY - FORMATO DE TRAMA» | Formato de trama (imagen): el campo Address contiene el DLCI; no dice explícitamente que se conmute por él. |  |
| `redes-c40` | ¿Porque motivo Frame Relay no utiliza Nº de secuencia? | `u1-frame-relay-atm.pdf` p. 1 | low | «PVCs; SVCs no implementados» | Muestra que usa circuitos virtuales, pero no lo vincula con la falta de números de secuencia. | u1-introduccion.pdf p.10 |
| `redes-c41` | ¿Cual es la AAL correspondiente a un circuito de voz (emulación de circuito telefónico)? | `u1-frame-relay-atm.pdf` p. 15 | medium | «DISTINTOS TIPOS DE TRAFICO» | Tabla: AAL1 = tiempo real, velocidad constante, orientado a conexión (perfil de voz); no nombra la voz. | u1-introduccion.pdf p.24 |
| `redes-c43` | ¿Cual es la AAL correspondiente a una transmisión de video con compresión? | `u1-frame-relay-atm.pdf` p. 15 | medium | «DISTINTOS TIPOS DE TRAFICO» | Tabla: AAL2 = tiempo real, velocidad variable (perfil de video comprimido); no nombra el video. | u1-introduccion.pdf p.24 |
| `redes-c48` | ¿Que sucede cuando un cliente Frame Relay transmite a un tasa Be? | `u1-frame-relay-atm.pdf` p. 5 | medium | «De allí surge CIR = Bc/Tc y EIR = Be/Tc» | El bit DE aparece en el formato de trama (p. 2), pero no se explica su uso. | u1-introduccion.pdf p.14 |
| `redes-c52` | ¿Cuales son los formatos definidos para LMI (Local Managment Interface)? | `u1-frame-relay-atm.pdf` p. 3 | high | «Tres formatos definidos:» |  | u1-introduccion.pdf p.12 |
| `redes-c54` | ¿Cual es la AAL correspondiente a IP? | `u1-frame-relay-atm.pdf` p. 15 | high | «AAL5 específicamente para transf.datos» |  | u1-introduccion.pdf p.24 |
| `redes-c59` | ¿Cual de las siguientes opciones son válidas para el protocolo ATM? | `u1-frame-relay-atm.pdf` p. 8 | high | «Su naturaleza asincrónica le permite mejores rendimientos que otras técnicas de multiplexado» |  | u1-introduccion.pdf p.17 |
| `redes-c62` | ¿Que mecanismo utiliza un router corriendo Frame Relay para mapear una dirección de red… | `u1-frame-relay-atm.pdf` p. 3 | low | «resolución de direcciones» | Menciona la resolución de direcciones como extensión LMI; no nombra ARP inverso. | u1-introduccion.pdf p.12, u3-capa-de-red.pdf p.9 |
| `redes-m5` | Con respecto a la capacidad del enlace, ¿cómo se ordenan las categorías de servicio en … | `u1-frame-relay-atm.pdf` p. 16 | high | 🖼 «CATEGORIAS DE SERVICIO» | Gráfico (imagen) de ocupación de la capacidad del link: CBR abajo, luego VBR, ABR y UBR arriba. | u1-introduccion.pdf p.25 |
| `redes-c0` | Seleccione características de ruteo jerarquico | `u3-capa-de-red.pdf` p. 22 | medium | «los enrutadores se dividen en lo que llamaremos regiones» | Respalda la división en regiones y el resumen de tablas; no menciona ln N. |  |
| `redes-c3` | Que propiedades debiera tener un algoritmo de enrutamiento | `u3-capa-de-red.pdf` p. 12 | high | «Propiedades de un Algoritmo de Enrutamiento» |  |  |
| `redes-c24` | Cuales de las siguientes opciones son verdaderas para enrutamiento por estado de enlace: | `u3-capa-de-red.pdf` p. 19 | medium | «La parte más complicada del algoritmo es la distribución confiable de los paquetes de estado del enlace.» | El cálculo de SPF (Dijkstra) está en la p. 18; no se habla de la convergencia ni de la complejidad. |  |
| `redes-c26` | En el enrutamiento por estado de enlace, cada ruteador debe: | `u3-capa-de-red.pdf` p. 18 | high | «Calcular métrica (p.ej.retardos)» |  |  |
| `redes-c31` | A los algoritmos de enrutamiento no adpatativos se los utiliza en enrutamiento estático | `u3-capa-de-red.pdf` p. 14 | low | «Ruteo estático.» | No usa el término «no adaptativo». |  |
| `redes-c37` | El algoritmo de vector distancia es también conocido por: | `u3-capa-de-red.pdf` p. 15 | low | «Los algoritmos de enrutamiento por vector de distancia» | No menciona Bellman-Ford ni Ford-Fulkerson. |  |
| `redes-c55` | Las principales funciones de la capa de red son: | `u3-capa-de-red.pdf` p. 9 | high | «Los Enrutadores cumplen dos funciones: Determinacion de ruta y Conmutacion» |  |  |
| `redes-c56` | El árbol de optimalidad es aquel que se forma por las rutas óptimas desde todos los orí… | `u3-capa-de-red.pdf` p. 10 | high | «el grupo de rutas óptimas de todos los orígenes a un destino dado forman un árbol con raíz en el destino» |  |  |
| `redes-c57` | Seleccione algoritmos de enrutamiento estático: | `u3-capa-de-red.pdf` p. 14 | medium | «El concepto de ruta más corta» | Ubica a Dijkstra bajo «Ruteo estático»; la inundación no figura. |  |
| `redes-c63` | En que condiciones de la red es útil la aplicación de QoS | `u3-capa-de-red.pdf` p. 9 | low | «Aquí se aplica QoS (encolamiento)» | No dice en qué condiciones de congestión es útil. |  |
| `redes-c64` | El problema de conteo a Infinito que tiene el algoritmo de vector distancia se puede mi… | `u3-capa-de-red.pdf` p. 17 | low | «El problema de la cuenta a infinito» | Describe el problema, no las mitigaciones. |  |
| `redes-m16` | El principio de optimalidad establece que: | `u3-capa-de-red.pdf` p. 10 | high | «si J ∈ opt(I,K) ⇒ (J,K)» |  |  |

## Sin `source` (8)

| id | Enunciado | Motivo |
|---|---|---|
| `redes-m14` | Coloque el Nº de capa correcto a cada una de las siguientes opciones pertenecientes al … | El apunte no enumera las capas del modelo OSI con su número (en texto). |
| `redes-m15` | Modelo OSI vs TCP/IP: (seleccione las opciones correctas) | No hay comparación OSI vs TCP/IP en el apunte. |
| `redes-m6` | Los números mágicos en PPP se utilizan: | El apunte no menciona los números mágicos de PPP. |
| `redes-c58` | ¿Cuales son los supuestos en cuanto al tiempo en que las estaciones de un canal compart… | El apunte no describe los supuestos de tiempo continuo o ranurado. |
| `redes-m3` | El período de vulnerabilidad de una trama en: | No hay texto sobre el período de vulnerabilidad de ALOHA (la respuesta sigue la clave del PDF de la cátedra, que contradice la bibliografía: ver la nota de la pregunta). |
| `redes-m25` | Bridges - Reconfiguración | No hay texto sobre la reconfiguración (tiempos de caché, FORWARD_DELAY, TC/TCA). |
| `redes-c1` | La técnica de horizonte dividido funciona en todas las topologías | El apunte no menciona el horizonte dividido. |
| `redes-c45` | Las causas de la congestión pueden ser: | El apunte no enumera las causas de la congestión. |

## Páginas sin texto extraíble (< 40 caracteres)

No pueden respaldar preguntas por búsqueda de texto; algunas se revisaron como imagen (🖼).

- `u1-adsl.pdf` (10 págs.): 8, 10
- `u1-enlace.pdf` (52 págs.): 18, 32, 42, 46, 47, 48, 49, 52
- `u1-frame-relay-atm.pdf` (16 págs.): 2, 4, 6, 9, 11, 13, 14, 16
- `u1-introduccion.pdf` (35 págs.): 3, 4, 5, 6, 7, 8
- `u2-2025.pdf` (153 págs.): 1, 19, 31, 36, 40, 41, 42, 43, 56, 64, 65, 68, 71, 72, 79, 89, 90, 91, 92, 93, 94, 98, 103, 141, 142, 148, 149
- `u3-capa-de-red.pdf` (23 págs.): 13
