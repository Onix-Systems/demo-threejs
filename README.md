for create a build bundle into /build/bundle.js  use command: "rollup -c"
for start node server use command: "npm start"

file "node_modules/three/build/three.module.js" is modified. Export to standalone viewer depends on it. If something gone wrong there is a line of code to be added:
	line 34883: texture.image.data = texData.data; // after this
	line 34884: texture.image.buffer = buffer; // add this