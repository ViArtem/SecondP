const express = require('express')

//Modules
const cluster = require('cluster')
const Emitter = require('events')
const path = require('path')
const dotev = require('dotenv')
const os = require('os')
const stream = require('stream')
const zlib = require('zlib')
const totalCPUs = os.cpus().length
const fs = require('fs')

//

let bodyParser = require('body-parser')
let urlencodedParser = bodyParser.urlencoded({ extended: false })


let port = process.env.PORT
dotev.config()
//
const timer = new Emitter()
const em = (time)=>{
    console.log(`You requested information at ${time} p.m` );
}

// Event that returns you information about when the information was received

timer.on('getTime', em)

// database simulation

const databaseGame = [
    {name: 'Wolfenstein', os: 'Windows_NT', corses: 4, architecture: 32, RAM: 4 },
    {name: 'CS:GO', os: 'Windows_NT', corses: 2, architecture: 32, RAM: 3},
    {name: 'World of Tanks', os: 'MacOS', corses: 2, architecture: 32, RAM: 4},
    {name: 'World of Warcraft', os: 'Windows_NT', corses: 8, architecture: 64, RAM: 6},
    {name: 'Battle city', os: 'Linux', corses: 1, architecture: 32, RAM: 1},
]
//




if(cluster.isPrimary){

    console.log(`Number of processes: ${totalCPUs}`);
    console.log(`Master ${process.pid} is running`);

    for (let i = 0; i < totalCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal)=>{ 
        console.log(`worker ${worker.process.pid} died`);
        console.log("Let's fork another worker!");
        cluster.fork()
    })

}else{
    startServer()
}


function startServer() {
    const app = express()

    app.get('/', (req, res)=>{
        res.sendFile(path.join(__dirname, 'stat', "index.html"))
    })

    app.post('/about', (req, res)=>{
        console.log(
            `
            Your operating system: ${os.type()}, ${os.platform()},

            Number of corses(threads): ${os.cpus().length},

            Processor architecture: ${os.arch()},

            Your RAM: ${os.totalmem()/ 10**9}
             
        `
        );
        
       
       timer.emit('getTime', `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`)
        
        res.redirect('/')
       
        
        
    })


    app.get('/infogame', (req, res)=>{
        //Searches the array for objects that match your characteristics and returns an array of game titles that suit you
       let yourgame = databaseGame.filter((game)=> 
       game.os == os.type() && game.RAM <= (Number( os.totalmem()/ 10**9)) && game.corses <= Number(os.cpus().length)  && game.architecture <= Number(os.arch().split('')[1] + '4')
    
       ).map((gm)=>{return gm.name} )
        //

        console.log('------------'); 
        console.log('Games that suit you:');
        console.log('');
        for (let i = 0; i < yourgame.length; i++) {
            console.log(yourgame[i]);
            console.log('');  
        }
        console.log('------------'); 
        timer.emit('getTime', `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`)
        res.redirect('/')
        
    })

    app.post('/sendtext', urlencodedParser, (req, res)=>{

        
        let userInfo = `Information about you:

    ${req.body.usInfo}
        ` 
        const writeStream = fs.createWriteStream(path.join(__dirname, 'text.txt'))
        const writeNewStream = fs.createWriteStream(path.join(__dirname, 'textN.txt'))
        const readStream = fs.createReadStream(path.join(__dirname, 'text.txt'))
        const compressStream = zlib.createGzip()

        
        writeStream.write(userInfo)
        
        const handleError = ()=>{
            console.log('Error');
            readStream.destroy()
            writeStream.end('Finished with error')
        }
        
        readStream
            .on('error', handleError)
            .pipe(compressStream) 
            .pipe(writeNewStream)
            .on('error', handleError)
       
        

        res.redirect('/')
    })

    app.get('/getInfo', (req, res)=>{
        const writeStream = fs.createWriteStream(path.join(__dirname, 'textR.txt'))
        const readStream = fs.createReadStream(path.join(__dirname, 'textN.txt'))
        const compressUnStream = zlib.createUnzip()

        readStream.pipe(compressUnStream).pipe(writeStream)
        res.sendFile(path.join(__dirname, "text.txt"))
    })

    app.listen(port, ()=>{
        console.log('Server started...');
    })
}
