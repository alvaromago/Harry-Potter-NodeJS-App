const { MongoClient } = require("mongodb");
const urlConexion = "mongodb://127.0.0.1:27017";
const conexion = new MongoClient(urlConexion);
const http = require("http");
const url = require("url");
const fs = require("fs");
const server = http.createServer();

const db = "harry";
const collection = "personajes";
const todos = document.getElementById("todos");
const humanos = document.getElementById("humanos");
const anio = document.getElementById("anio");
const holly = document.getElementById("holly");
const estudiantes = document.getElementById("estudiantes");

server.on("request", function (peticion, respuesta) {
	let urlCompleta = url.parse(peticion.url, true);
	let pathname = urlCompleta.pathname;

	if (pathname == "/importar") {
		eliminarColeccion().then(console.log).catch(console.error);

		fs.readFile("harry-potter-characters.json", function (err, datos) {
			let datosJSON = JSON.parse(datos);
			// Insertar JSON
			insertar(datosJSON, db, collection).then(console.log).catch(console.error);
		});

		respuesta.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
		respuesta.write("<h1>Datos introducidos correctamente</h1>");
		respuesta.end();
	} else if (pathname == "/consultar") {
		consultarTodos(db, collection, respuesta);

		todos.addEventListener("click", function () {
			consultarTodos(db, collection, respuesta);
		});
		humanos.addEventListener("click", function () {
			consultarF1(db, collection, respuesta);
		});
		anio.addEventListener("click", function () {
			consultarF2(db, collection, respuesta);
		});
		holly.addEventListener("click", function () {
			consultarF3(db, collection, respuesta);
		});
		estudiantes.addEventListener("click", function () {
			consultarF4(db, collection, respuesta);
		});
	} else {
		respuesta.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
		respuesta.write("<h1>URL Incorrecta</h1>");
		respuesta.end();
	}
});

server.listen(8080, "127.0.0.1");
console.log("Servidor corriendo en localhost:8080");

// Insertar JSON
async function insertar(datos, db, collection) {
	await conexion.connect();
	const dbo = conexion.db(db);
	// La variable datos guarda los datosJSON
	let resultado = await dbo.collection(collection).insertMany(datos);
	console.log("Datos insertados", resultado);
}

// Eliminar colección
async function eliminarColeccion() {
	await conexion.connect();
	const dbo = conexion.db(db);

	let result = await dbo.collection(collection).drop();
	console.log(result);
}

// Consultar todos
async function consultarTodos(db, collection, respuesta) {
	await conexion.connect();
	const dbo = conexion.db(db);

	let salida = "";
	let resultado = await dbo.collection(collection).find({}).toArray();
	salida = crearHTML(resultado);
	respuesta.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
	respuesta.write(salida);
	respuesta.end();
}

// Consultar Filtro 1 (Humanos)
async function consultarF1(db, collection, respuesta) {
	await conexion.connect();
	const dbo = conexion.db(db);

	let salida = "";
	let resultado = await dbo.collection(collection).find({ species: "human" }).toArray();
	salida = crearHTML(resultado);
	respuesta.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
	respuesta.write(salida);
	respuesta.end();
}

// Consultar Filtro 2 (< 1979)
async function consultarF2(db, collection, respuesta) {
	await conexion.connect();
	const dbo = conexion.db(db);

	let salida = "";
	let resultado = await dbo
		.collection(collection)
		.find({ yearOfBirth: { $lt: 1979 } })
		.toArray();
	salida = crearHTML(resultado);
	respuesta.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
	respuesta.write(salida);
	respuesta.end();
}

// Consultar Filtro 3 (Holly)
async function consultarF3(db, collection, respuesta) {
	await conexion.connect();
	const dbo = conexion.db(db);

	let salida = "";
	let resultado = await dbo.collection(collection).find({ "wand.wood": "holly" }).toArray();
	salida = crearHTML(resultado);
	respuesta.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
	respuesta.write(salida);
	respuesta.end();
}

// Consultar Filtro 4 (Estudiantes vivos)
async function consultarF4(db, collection, respuesta) {
	await conexion.connect();
	const dbo = conexion.db(db);

	let salida = "";
	let resultado = await dbo
		.collection(collection)
		.find({ $and: [{ alive: true }, { hogwartsStudent: true }] })
		.toArray();
	salida = crearHTML(resultado);
	respuesta.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
	respuesta.write(salida);
	respuesta.end();
}

function crearHTML(datosTabla) {
	let contenido = `<html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
            <title>Práctica Tema 4 DWS</title>
        </head>
        <body>
            <div class="container-fluid">
				<h1 class="text-center pt-5 pb-2">Práctica Tema 4 DWS</h1>
				<h3 class="text-center pb-4" style="opacity:.7;color:crimson;">Personajes Harry Potter</h3>
				<div class="container text-center">
					<a class="btn btn-success" id="todos">Todos</a>
					<a class="btn btn-success" id="humanos">Humanos</a>
					<a class="btn btn-success" id="anio">< 1979</a>
					<a class="btn btn-success" id="holly">Holly</a>
					<a class="btn btn-success" id="estudiantes">Estudiantes vivos</a>
				</div>
                <div class="container py-5">
                    <table class="table">
                    <thead>
                    <tr>
                        <th>Imagen</th>
                        <th>Nombre</th>
                        <th>Especie</th>
                        <th>Género</th>
                        <th>Casa</th>
                        <th>Año Nacimiento</th></tr>
                    </thead>
                    <tbody>`;

	for (i = 0; i < datosTabla.length; i++) {
		let imagen = "";
		let nombre = "";
		let especie = "";
		let genero = "";
		let casa = "";
		let anoNacimiento = 0;

		if (datosTabla[i].image != null) {
			imagen = datosTabla[i].image;
		}
		if (datosTabla[i].name != null) {
			nombre = datosTabla[i].name;
		}
		if (datosTabla[i].species != null) {
			especie = datosTabla[i].species;
		}
		if (datosTabla[i].gender != null) {
			genero = datosTabla[i].gender;
		}
		if (datosTabla[i].house != null) {
			casa = datosTabla[i].house;
		}
		if (datosTabla[i].yearOfBirth != null) {
			anoNacimiento = datosTabla[i].yearOfBirth;
		}

		contenido +=
			"<tr><td>" +
			imagen +
			"</td><td>" +
			nombre +
			"</td><td>" +
			especie +
			"</td><td>" +
			genero +
			"</td><td>" +
			casa +
			"</td><td>" +
			anoNacimiento +
			"</td></tr>";
	}

	contenido += `      </tbody>
                    </table>
                </div>
            </div>
        </body>
    </html>`;

	return contenido;
}
