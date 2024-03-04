const http = require("http");
const url = require("url");
const fs = require("fs");
const { MongoClient, ObjectId } = require("mongodb");

const urlConexion = "mongodb://127.0.0.1:27017";
const conexion = new MongoClient(urlConexion);

const db = "harry";
const collection = "personajes";

const server = http.createServer();
server.on("request", async function (peticion, respuesta) {
	let urlCompleta = url.parse(peticion.url, true);
	let pathname = urlCompleta.pathname;

	respuesta.setHeader("Access-Control-Allow-Origin", "*");
	respuesta.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

	if (pathname == "/importar") {
		// Elimina todos los registros antes de importar
		await eliminar();
		fs.readFile("harry-potter-characters.json", function (err, datos) {
			if (err) {
				respuesta.writeHead(404, { "Content-Type": "text/html" });
				respuesta.write("<h1>Error al cargar el JSON</h1>");
				respuesta.end();
				return;
			}
			let datosJSON = JSON.parse(datos);

			insertar(datosJSON, db, collection)
				.catch(console.error)
				.finally(() => conexion.close());

			respuesta.writeHead(404, {
				"Content-Type": "text/html; charset=utf-8",
			});
			respuesta.write("<h1>Base de datos y colección creada</h1>");
			respuesta.end();
		});
	} else if (pathname == "/consultar") {
		if (peticion.method === "POST") {
			let datos = [];
			peticion.on("data", (chunk) => {
				datos.push(chunk);
			});
			peticion.on("end", () => {
				mostrarTodo(db, collection, respuesta);
			});
		} else {
			fs.readFile("index.html", function (err, datos) {
				if (err) {
					respuesta.writeHead(404, { "Content-Type": "text/html" });
					respuesta.write("<h1>Error al cargar el archivo HTML</h1>");
					respuesta.end();
					return;
				}
				respuesta.writeHead(200, { "Content-Type": "text/html" });
				respuesta.write(datos);
				respuesta.end();
			});
		}
	} else if (pathname == "/filtro1") {
		filtroBasico("species", "human", respuesta);
	} else if (pathname == "/filtro2") {
		filtroBasico("yearOfBirth", { $lt: 1979 }, respuesta);
	} else if (pathname == "/filtro3") {
		filtroBasico("wand.wood", "holly", respuesta);
	} else if (pathname == "/filtro4") {
		filtroComplejo(respuesta);
	} else if (pathname.startsWith("/eliminar/")) {
		let id = pathname.split("/")[2]; // Obtiene el ID a través de la URL
		await eliminarPersonaje(id, respuesta);
	} else if (pathname == "/eliminarPersonaje") {
		let datos = "";
		peticion.on("data", (chunk) => {
			datos += chunk;
		});
		peticion.on("end", () => {
			const nuevoPersonaje = JSON.parse(datos);
			eliminarPersonaje(nuevoPersonaje, respuesta);
		});
	} else {
		respuesta.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
		respuesta.write("<h1>URL incorrecta</h1>");
		respuesta.end();
	}
});

// Crea la BD e importar datos del JSON
async function insertar(datos, db, collection) {
	await conexion.connect();
	const dbo = conexion.db(db);

	await dbo.collection(collection).insertMany(datos);
}

// Elimina la BD y colección
async function eliminar() {
	await conexion.connect();
	const dbo = conexion.db(db);

	await dbo.collection(collection).drop();
}

// Crea la tabla
function crearTabla(datosTabla) {
	let contenido = "";
	for (let i = 0; i < datosTabla.length; i++) {
		let { image, name, species, gender, house, yearOfBirth, _id } = datosTabla[i];

		contenido += `
      <tr>
        <td>${image || ""}</td>
        <td>${name || ""}</td>
        <td>${species || ""}</td>
        <td>${gender || ""}</td>
        <td>${house || ""}</td>
        <td>${yearOfBirth || ""}</td>
        <td>
        <button class="btn btn-danger btn-sm" onclick="eliminarRegistro('${_id}')">
          Borrar
        </button>
        </td>
      </tr>`;
	}
	return contenido;
}

// Consulta los registros
async function mostrarTodo(db, collection, respuesta, filtro) {
	await conexion.connect();
	const dbo = conexion.db(db);

	let salida = "";
	let query = filtro ? filtro : {};
	let resultado = await dbo.collection(collection).find(query).toArray();

	salida = crearTabla(resultado);
	respuesta.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
	respuesta.write(salida);
	respuesta.end();
}

// Filtros
async function filtroBasico(atributo, valor, respuesta) {
	let filtro = { [atributo]: valor };
	await mostrarTodo(db, collection, respuesta, filtro);
}

async function filtroComplejo(respuesta) {
	let filtro = { alive: true, hogwartsStudent: true };
	await mostrarTodo(db, collection, respuesta, filtro);
}

// Elimina un personaje
async function eliminarPersonaje(id, respuesta) {
	await conexion.connect();
	const dbo = conexion.db(db);

	await dbo.collection(collection).deleteOne({ _id: new ObjectId(id) });
	await mostrarTodo(db, collection, respuesta);
}

// Agrega un personaje
async function eliminarPersonaje(nuevoPersonaje, respuesta) {
	try {
		await conexion.connect();
		const dbo = conexion.db(db);
		await dbo.collection(collection).insertOne(nuevoPersonaje);
		respuesta.writeHead(200, { "Content-Type": "application/json" });
		respuesta.end(JSON.stringify({ message: "Personaje agregado correctamente" }));
	} catch (error) {
		respuesta.writeHead(500, { "Content-Type": "application/json" });
		respuesta.end(JSON.stringify({ error: "Error al agregar el nuevo personaje" }));
	}
}

server.listen(8080, "localhost");
console.log("Servidor corriendo: 8080");
