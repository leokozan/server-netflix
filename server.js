var express = require('express');
const session = require('express-session');
var cors = require('cors');
const axios = require('axios');
const jwt = require("jsonwebtoken");
const DNS = 'https://api.themoviedb.org/3'
const API_KEY = ''
const secretKey = "123";
var app = express();
app.use(express.json());
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
  }));
app.use(express.json());

var port = process.env.PORT || 5000;

app.use(cors());

var dados = {
    usuarios: [
        {id: '1', nome:'Teste da Silva Junior', email: 'teste@teste.com', senha: '1234', idade: '16'},   
        {id: '2', nome:'Teste da Silva Maciel', email: 'maciel@teste.com', senha: '1234', idade: '12'},   
        {id: '3', nome:'Teste da Silva Kobayashi', email: 'kobayashi@teste.com', senha: '1234', idade: '18'},          
    ]
}

const generateToken = (userID) => {
    return jwt.sign({userID}, secretKey, { expiresIn: 60 * 60});
};

function verifyJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Assume o formato "Bearer <token>"

  if (!token) return res.status(401).json({ auth: false, message: 'No token provided.' });

  jwt.verify(token, secretKey, (err, decoded) => {
      if (err) return res.status(500).json({ auth: false, message: 'Failed to authenticate token.' });

      req.session.usuarioID = decoded.userID;
      next();
  });
}
function findUserByID(userID){
    let encontrado = {}
    
    dados.usuarios.forEach((usuario)=>{
        if(usuario.id==userID){
            encontrado = usuario
        }
    })
    
    return encontrado
}
function findIdadeByID(userID,filmes){
    let idade = {}
    dados.usuarios.forEach((usuario)=>{
        if(usuario.id==userID){
            idade = usuario.idade
        }
    })
    if(idade<18){
      let filmesFiltrados =filmes.results;
      let filmesFiltrados2 = filmesFiltrados.filter((filme)=>filme.adult===false);
      console.log(filmesFiltrados2)
      filmes.results = filmesFiltrados2
      return filmes
    }else{
      return filmes
    }
}
app.post('/login', (req, res, next)=>{

    console.log( req.body)
 
    let logado = false
    let usuarioLogado = {}
    dados.usuarios.forEach((usuario)=>{
        if(usuario.email==req.body.username && usuario.senha==req.body.password){
            logado = true
            usuarioLogado = usuario
        }
    })

    if(logado){
        const sessionData = req.session;
        req.session.isLogado = true;
        req.session.usuarioID = usuarioLogado.id;
        console.log('login ', req.session)
        const token = generateToken(usuarioLogado.id);
        res.send({sessionID: token})
    }else{
        res.send('Error....')
        console.log('Deu errado')
    }
        
})
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed.' });
        }
        res.status(200).json({ message: 'Logout successful.' });
    });
});

app.post('/test', verifyJWT, (req, res, next)=>{
    const sessionData = req.session;
    console.log('test ', sessionData)

    //com id correto posso buscar o resto das informações do usuario
    let usuario = findUserByID(sessionData.usuarioID)
    console.log(usuario)
    res.send(usuario.nome)
})

// Rotas para os filmes

app.get('/movies/popular',verifyJWT, async(req, res) => {
    const sessionData = req.session;
    try {
      const response = await axios.get(`${DNS}/trending/all/week?api_key=${API_KEY}&language=pt-BR`);
      let filmesFiltrado = findIdadeByID(sessionData.usuarioID,response.data)
      res.json(filmesFiltrado);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar filmes populares' });
    }
  });
  
app.get('/movies/netflixOriginals', verifyJWT,async(req, res) => {
    try {
      const response = await axios.get(`${DNS}/discover/tv?api_key=${API_KEY}&with_networks=213`);
      let filmesFiltrado = findIdadeByID(sessionData.usuarioID,response.data)
      res.json(filmesFiltrado);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar filmes populares' });
    }
  });
  
app.get('/movies/topRated',verifyJWT, async(req, res) => {
    try {
      const response = await axios.get(`${DNS}/movie/top_rated?api_key=${API_KEY}&language=pt-BR`);
      let filmesFiltrado = findIdadeByID(sessionData.usuarioID,response.data)
      res.json(filmesFiltrado);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar filmes populares' });
    }
  });
  
app.get('/movies/comedy',verifyJWT, async(req, res) => {
    try {
      const response = await axios.get(`${DNS}/discover/tv?api_key=${API_KEY}&with_genres=35`);
      let filmesFiltrado = findIdadeByID(sessionData.usuarioID,response.data)
      res.json(filmesFiltrado);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar filmes populares' });
    }
  });
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});