[![Typing SVG](https://readme-typing-svg.demolab.com?font=Roboto&weight=800&size=30&duration=2500&pause=500&color=B050F7&background=FFFFFF00&vCenter=true&width=435&lines=Packetly;Manage+all+your+game+assets;Collaborate+with+your+team;Organize+projects+and+files)](https://git.io/typing-svg)

[Packetly.space](https://packetly.space)

## Frontend

Se encuentra dentro de la carpeta `/packetly`

Para hacer uso del frontend (hacer modificaciones, correr el servidor front en local...)

```bash
cd packetly

# Para instalar dependencias de node
npm i

# Para correr el front en local
npm run dev

# Para el registro, hay que instalar dependencias en `/backend`
cd backend
npm install express mongoose bcryptjs cors dotenv
npm install -D @types/express @types/bcryptjs @types/cors

# Para el login, se instalan estas dependecias, también en `/backend`
npm install jsonwebtoken
npm install -D @types/jsonwebtoken

# Por si fuera necesario, anoto que en `/packetly`, he tenido que hacer este comando:
npm install react-router-dom
```
