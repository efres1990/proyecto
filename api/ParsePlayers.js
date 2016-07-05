'use strict';
//modules
const Fs      = require('fs');
const Cheerio = require('cheerio');
const Request = require('request');
const SemFutbol = require('semaphore')(1);
const Sem = require('semaphore')(1);
const Mongodb = require('mongodb');
const MongoClient = Mongodb.MongoClient;
const internals = {
    ligas: {
        BBVA: {
            nJ: 38,
            urlBase: 'http://www.resultados-futbol.com/primera/grupo1/jornada'
        },
        Adelante: {
            nJ: 42,
            urlBase: 'http://www.resultados-futbol.com/segunda/grupo1/jornada'
        },
        LNFS: {
            nJ: 30,
            urlBase: 'http://www.lnfs.es/Competiciones/temp15-16/25/Jornada-'
        }
    }
};

const aJ = [];
//const Locks = require('locks');
//const mutex = Locks.createMutex();
let pB = 0;
let pA = 0;
let partidoSala = 0;
const ParsearFutbol = (liga) => {

    for (let i = 1; i <= liga.nJ; i = i + 1) {

        const url2 = liga.urlBase + i;
        //mutex.lock(function (){ Con lock
        SemFutbol.take(() => {

            console.log(url2);
            Request(url2, (error, response, html) => {

                if (!error){
                    const $ = Cheerio.load(html);
                    let jornada = $('#col-resultados').children().eq(0).children().eq(0).children().eq(0).children().eq(0).children().eq(0).text();
                    if (jornada === 'Mostrar Apuestas'){
                        jornada = $('#col-resultados').children().eq(0).children().eq(0).children().eq(0).children().eq(0).children().eq(2).text();
                    }
                    console.log('j-' + jornada);
                    $('#tabla1 > tr.vevent').each(( indexRegistros, elemRegistros ) => {

                        let ligaa = ($('#titular').children().eq(3).children().eq(2).text()).substring(5,9);
                        if (liga.nJ === 38 && ligaa !== 'BBVA'){
                            console.log(new Error('Error leyendo liga'));
                        }
                        //console.log($('#microdatos_information').children().eq(0).children().eq(0).children().eq(0).text());
                        if (liga.nJ === 42){
                            ligaa = 'Adelante';//$('#microdatos_information').children().eq(0).children().eq(0).children().eq(0).text();
                        }
                        const temporada = $('#columna_segunda').children().eq(0).children().eq(3).children().eq(0).text();
                        const equipoLocal = ($(elemRegistros).children().eq(2).children().eq(1).text());
                        const equipoVisitante = ($(elemRegistros).children().eq(4).children().eq(1).text());
                        const estadio = ($(elemRegistros).children().eq(3).children().eq(2).text());
                        const fecha = ($(elemRegistros).children().eq(1).attr('data-date'));
                        let estado = ($(elemRegistros).children().eq(1).children().eq(2).text());
                        const horaX = ($(elemRegistros).children().eq(3).children().eq(4).children().eq(0).text());
                        if (($(elemRegistros).children().eq(1).children().eq(1).text()) === 'Sin comenzar'){ //Sin comenzar cambia
                            estado = 'Completo';
                        }
                        if (horaX === 'x-x'){
                            estado = 'Incompleto';
                        }
                        console.log(jornada + ' // ' + equipoLocal);
                        const json = {
                            l : ligaa,
                            temp :temporada,
                            j : jornada.substring(8, 10),
                            eL :equipoLocal ,//cogemos el segundo hijo de vevent que sera el tercer td ya que el primero vale 0 dentro de ese cogemos el segundo hijo que sera la clase equipo1 y cogemos el texto.
                            eV :equipoVisitante,
                            e : estadio,
                            f: limpiarFechaLiga(fecha),
                            est : estado
                        };
                        ConectarBBDD(json);
                        if (ligaa === 'BBVA'){
                            pB++;
                            if (error) {
                                console.log(err.stack);
                            }
                        }

                        else if (ligaa === 'Adelante'){
                            pA++;
                        }
                        if (pB === 10){
                            //mutex.unlock();
                            setTimeout(SemFutbol.leave, 500);
                            pB = 0;
                        }
                        if (pA === 11){
                            setTimeout(SemFutbol.leave, 500);
                            //mutex.unlock();
                            pA = 0;
                        }
                        //console.log(json);
                        aJ.push(json);
                    });
                    Fs.writeFile('./tmp/output.json', JSON.stringify(aJ, null, 4), (err) => {

                        if (err) {
                            console.log(err.stack);
                        }
                    });
                }
                else {
                    console.log(err.stack);
                }
            });
        });
    };
};

const ConectarBBDD = (json) => {

    const urlM = 'mongodb://elafr:papaya123@ds051585.mlab.com:51585/predinten';
    //const urlM = 'mongodb://admin:claradelrey2@m.predinten.com:27017/local?ssl=true';
    MongoClient.connect(urlM, (err, db) => {

        if (err) {
            console.log(err);
        }
        else {
            //console.log('Connection established to', urlM);
            const collection = db.collection('partidos');
            collection.insert(json, (err, result) => {

                db.close();
                if (err) {
                    console.log(err.stack);
                }
                db.close();
            });
        }
    });
};
const limpiarFechaLiga = (fechaPartido) => {

    const fechaHoraCompleta = fechaPartido.split(', ');
    const fechaHoraMas = fechaHoraCompleta[1].split(' +');
    const fechaHora = fechaHoraMas[0].split(' ');

    const hora =  fechaHora[3].toString();
    const anio = fechaHora[2].toString();
    const dia = fechaHora[0].toString();
    if (dia.length < 2){
        dia = 0 + '' + dia;
    }
    const aM = ['eeeeeeeeeee','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    let mes = aM.indexOf(fechaHora[1]).toString();
    if (mes.length < 2){
        mes = 0 + '' + mes;
    }
    const fechaLimpia = anio + '-' + mes + '-' + dia +  ' ' + hora;
    return fechaLimpia;
};
const limpiarFechaSala = (fechaPartido,horaPartido) => {
	//06/09/2014
    const fechaCompleta = fechaPartido.split('/');//[06][09][2014]

    const dia = fechaCompleta[0].toString();
    const anio = fechaCompleta[2].toString();
    const mes = fechaCompleta[1].toString();
    const hora = horaPartido.substr(horaPartido.length - 5) + ':00';//[20:00]
    const fechaLimpia = anio + '-' + mes + '-' + dia + ' ' + hora;
    return fechaLimpia;
};
const limpiarTexto = (texto) => {

    texto = texto.replace(/  /gi,' ');
    texto = texto.replace('"', '');
    texto = texto.replace('"', '');
    texto = texto.replace('\n', '');
    texto = texto.replace('\n', '');
    texto = texto.replace('Pab.', 'Pabellon');
    texto = texto.replace('Mun.', 'Municipal');
    texto = texto.replace('dfcdfcdf ', '');
    texto = texto.replace(/.*gel Xim/, 'Ángel Xim');
    texto = texto.replace(/Xim.*z  P. Genil/, 'Ximénez P. Genil');
    texto = texto.replace(/Xim.*z P. Genil/, 'Ximénez P. Genil');
    texto = texto.replace(/Xim.*z P.Genil/, 'Ximénez P. Genil');
    texto = texto.replace(/Xim.*z  P.Genil/, 'Ximénez P. Genil');
    texto = texto.replace('P.Genil', 'P. Genil');
    texto = texto.replace(/Frigor.*cos Morrazo/, 'Frigoríficos Morrazo');
    texto = texto.replace(/BM. Arag.*n/, 'BM. Aragón');
    texto = texto.replace(/C.BM. Ademar Le.*n/, 'C.BM. Ademar León');
    texto = texto.replace(/                        /,'');
    texto = texto.replace(/La Bruixa d.*Or Manresa/, 'La Bruixa dOr Manresa');
    texto = texto.replace(/Tuenti M.*vil Estudiantes/, 'Tuenti Móvil Estudiantes');
    texto = texto.replace(/ABANCA Ademar Le.*n/, 'ABANCA Ademar León');
    texto = texto.replace(/Juanfersa Gij.*n/, 'Juanfersa Gijón');

    if (texto === 'Real') {
        texto = 'Zaragoza';
    }
    return texto;
};
//ParsearFutbol(url,nJ);
//ParsearFutbol(urlAdelante,nJA);
ParsearFutbol(internals.ligas.BBVA);
//ParsearSala(internals.ligas.LNFS);
//ParsearFutbol(internals.ligas.Adelante);
