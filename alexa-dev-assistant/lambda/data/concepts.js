'use strict';

// Glosario de conceptos. `synonyms[0]` es el valor canónico del slot DEV_CONCEPT.
module.exports = [
  {
    id: 'REST_API',
    synonyms: ['api rest', 'una api rest', 'rest', 'api restful'],
    text: 'Una API REST expone recursos en URLs y los manipulas con métodos HTTP: GET para leer, POST para crear, PUT o PATCH para actualizar y DELETE para borrar. Cada petición es independiente, sin estado guardado en el servidor.',
  },
  {
    id: 'GRAPHQL',
    synonyms: ['graphql', 'graph q l'],
    text: 'GraphQL es un lenguaje de consultas para APIs donde el cliente pide exactamente los campos que necesita, en un solo endpoint. Evita traer datos de más o de menos, a cambio de un servidor un poco más complejo.',
  },
  {
    id: 'DOCKER',
    synonyms: ['docker', 'un contenedor', 'contenedores'],
    text: 'Docker empaqueta tu aplicación con sus dependencias en una imagen. Al ejecutarla obtienes un contenedor: un proceso aislado que corre igual en tu laptop y en producción.',
  },
  {
    id: 'KUBERNETES',
    synonyms: ['kubernetes', 'k ocho s', 'cubernetes'],
    text: 'Kubernetes orquesta contenedores: decide en qué máquina corre cada uno, los reinicia si fallan, los escala según la carga y balancea el tráfico entre ellos.',
  },
  {
    id: 'CLOSURE',
    synonyms: ['un closure', 'closure', 'una clausura', 'closures'],
    text: 'Un closure es una función que recuerda las variables del ámbito donde se creó, aunque se ejecute después y fuera de él. Es la base de los contadores privados y de muchas funciones de orden superior.',
  },
  {
    id: 'PROMISE',
    synonyms: ['una promesa', 'promesa', 'promise', 'promesas'],
    text: 'Una promesa representa un valor que llegará en el futuro. Puede estar pendiente, cumplida o rechazada, y te deja encadenar código con then y catch, o esperarla con await.',
  },
  {
    id: 'ASYNC_AWAIT',
    synonyms: ['async await', 'async y await', 'programación asíncrona'],
    text: 'Async y await es azúcar sintáctica sobre promesas. Una función async siempre devuelve una promesa, y await pausa esa función hasta que la promesa se resuelve, sin bloquear el hilo.',
  },
  {
    id: 'SOLID',
    synonyms: ['solid', 'los principios solid', 'principios solid'],
    text: 'SOLID son cinco principios de diseño: responsabilidad única, abierto a extensión pero cerrado a modificación, sustitución de Liskov, segregación de interfaces e inversión de dependencias.',
  },
  {
    id: 'DEPENDENCY_INJECTION',
    synonyms: ['inyección de dependencias', 'dependency injection', 'inyectar dependencias'],
    text: 'La inyección de dependencias consiste en pasarle a un objeto lo que necesita desde afuera, en vez de que lo cree él mismo. Así puedes cambiar implementaciones y usar dobles en las pruebas.',
  },
  {
    id: 'MICROSERVICES',
    synonyms: ['microservicios', 'arquitectura de microservicios', 'un microservicio'],
    text: 'Los microservicios dividen un sistema en servicios pequeños que se despliegan por separado y se comunican por red. Ganas independencia entre equipos, pero pagas en complejidad operativa.',
  },
  {
    id: 'BIG_O',
    synonyms: ['big o', 'la notación big o', 'complejidad algorítmica', 'notación o grande'],
    text: 'La notación Big O describe cómo crece el tiempo o la memoria de un algoritmo cuando crece la entrada. O de uno es constante, O de n es lineal y O de n al cuadrado se vuelve lento muy rápido.',
  },
  {
    id: 'RECURSION',
    synonyms: ['recursión', 'recursividad', 'una función recursiva'],
    text: 'La recursión es cuando una función se llama a sí misma con un problema más pequeño. Necesita un caso base para detenerse; sin él, terminas en un desbordamiento de pila.',
  },
  {
    id: 'REBASE_VS_MERGE',
    synonyms: ['rebase contra merge', 'rebase', 'la diferencia entre rebase y merge'],
    text: 'Merge une dos ramas creando un commit de unión y conserva el historial tal cual. Rebase reaplica tus commits encima de la otra rama y deja un historial lineal, pero reescribe hashes: no lo uses en ramas compartidas.',
  },
  {
    id: 'CI_CD',
    synonyms: ['ci cd', 'integración continua', 'despliegue continuo', 'un pipeline'],
    text: 'CI, integración continua, compila y prueba cada cambio automáticamente al subirlo. CD, entrega o despliegue continuo, lleva esos cambios a producción con un proceso automatizado y repetible.',
  },
  {
    id: 'TDD',
    synonyms: ['tdd', 'desarrollo guiado por pruebas', 'test driven development'],
    text: 'TDD es escribir primero una prueba que falla, luego el código mínimo para que pase, y después refactorizar. El ciclo se conoce como rojo, verde, refactor.',
  },
  {
    id: 'ORM',
    synonyms: ['un orm', 'orm', 'mapeo objeto relacional'],
    text: 'Un ORM mapea tablas de la base de datos a objetos de tu lenguaje, para consultar y guardar sin escribir SQL a mano. Cuidado con el problema de las N más una consultas.',
  },
  {
    id: 'JWT',
    synonyms: ['jwt', 'un token jwt', 'json web token'],
    text: 'Un JWT es un token firmado con tres partes: encabezado, datos y firma. El servidor verifica la firma sin consultar una base de datos. Los datos van codificados, no cifrados, así que no guardes secretos ahí.',
  },
  {
    id: 'CORS',
    synonyms: ['cors', 'un error de cors', 'el error de cors'],
    text: 'CORS es la regla del navegador que bloquea peticiones a otro dominio, salvo que ese servidor responda con encabezados Access-Control-Allow-Origin. Se arregla en el servidor, no en el frontend.',
  },
  {
    id: 'WEBSOCKET',
    synonyms: ['websocket', 'websockets', 'un websocket'],
    text: 'Un WebSocket es una conexión bidireccional y persistente entre cliente y servidor. Sirve para chats, notificaciones en vivo y juegos, donde el servidor necesita empujar datos sin que se los pidan.',
  },
  {
    id: 'HOISTING',
    synonyms: ['hoisting', 'el hoisting'],
    text: 'Hoisting es cuando JavaScript sube las declaraciones al inicio de su ámbito. Las funciones declaradas se pueden usar antes de definirse; con let y const tocar la variable antes de declararla lanza un error.',
  },
  {
    id: 'CACHE',
    synonyms: ['caché', 'cache', 'una caché', 'cachear'],
    text: 'Una caché guarda resultados costosos para reutilizarlos rápido. Lo difícil es la invalidación: decidir cuándo un dato guardado ya no es válido.',
  },
  {
    id: 'IDEMPOTENCY',
    synonyms: ['idempotencia', 'idempotente', 'una operación idempotente'],
    text: 'Una operación es idempotente si repetirla da el mismo resultado que hacerla una vez. GET, PUT y DELETE deberían serlo; por eso es seguro reintentarlos ante un fallo de red.',
  },
  {
    id: 'SERVERLESS',
    synonyms: ['serverless', 'sin servidor', 'aws lambda', 'una función lambda'],
    text: 'Serverless es ejecutar funciones bajo demanda sin administrar servidores, como AWS Lambda. Pagas por invocación y escala solo; a cambio tienes arranques en frío y límites de tiempo. Esta skill corre así.',
  },
  {
    id: 'MVC',
    synonyms: ['mvc', 'el patrón mvc', 'modelo vista controlador'],
    text: 'MVC separa la aplicación en Modelo, los datos y reglas de negocio; Vista, lo que ve el usuario; y Controlador, que recibe las acciones y coordina a los otros dos.',
  },
  {
    id: 'RACE_CONDITION',
    synonyms: ['una condición de carrera', 'condición de carrera', 'race condition'],
    text: 'Una condición de carrera ocurre cuando el resultado depende del orden en que se ejecutan procesos concurrentes. Se evita con bloqueos, operaciones atómicas o evitando estado compartido.',
  },
  {
    id: 'DEADLOCK',
    synonyms: ['deadlock', 'un deadlock', 'interbloqueo'],
    text: 'Un deadlock es cuando dos procesos se esperan mutuamente para liberar un recurso y ninguno avanza. Se previene adquiriendo los bloqueos siempre en el mismo orden o usando tiempos límite.',
  },
  {
    id: 'HASH',
    synonyms: ['un hash', 'hash', 'función hash', 'hashing'],
    text: 'Un hash convierte cualquier dato en una huella de tamaño fijo. El mismo dato da siempre el mismo hash. Para contraseñas usa algoritmos lentos como bcrypt o argon2, nunca MD5.',
  },
];
