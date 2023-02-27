import { Vector3, Matrix3, Vector2 } from 'three';

class WorldSpaceUI {
  constructor (pos, type) {
    this.pos = pos ?? new Vector3();
    this.type = type ?? 'div';
    this._name = ' ';
    this._header = ' ';
    this._description = ' ';
    this._class = '';
    this._visible = false;
    this._offset = new Vector2(0,0);
    this.label = document.createElement(this.type);
    this.label.style.display = 'none';
    document.body.appendChild(this.label);

    if (this.type == "div") {
      this.header_el = document.createElement(this.type);
      this.header_el.innerHTML = this._header;
      this.description_el = document.createElement(this.type);
      this.description_el.innerHTML = this._description;
      this.label.appendChild(this.header_el);
      this.label.appendChild(document.createElement('hr'));
      this.label.appendChild(this.description_el);
    }

    this._2d = new Vector3();
  }

  get element(){
    return this.label;
  }

  set header (str){
    this._header = str;
    this.header_el.innerHTML = str;
    this.description_el.innerHTML = this._description;
  }

  set description (str){
    this._description = str;
    this.description_el.innerHTML = str;
    this.header_el.innerHTML = this._header;
  }

  set name (str) {
    this._name = str
    this.label.innerHTML = str;
  }
  set class (str) {
    this._class = str;
    this.label.className = this._class;
  }

  get visible () {
    return this._visible;
  }
  set visible (b) {
    if (b) {
      this._visible = true;
      this.label.style.display = 'inherit';
    } else {
      this._visible = false;
      this.label.style.display = 'none';
    }
  }

  set offset(o){
    this._offset = o;
  }

  get x () {return this._2d.x}
  get y () {return this._2d.y}
  set x (_x) {this.pos.x = _x}
  set y (_y) {this.pos.y = _y}
  set z (_z) {this.pos.z = _z}

  setAttribute (attr, value){
    this.label.setAttribute(attr, value);
  }

  update (camera, width, height) {
    if (!this._visible) return;
    if (this.pos == null) return;
    this._2d = this.WorldToScreenPoint(this.pos, camera, width, height);
    this.label.style.top  = (this._2d.y + this._offset.y).toString();
    this.label.style.left = (this._2d.x + this._offset.x).toString();
  }

  WorldToScreenPoint (point, camera, width, height) {
    if (!height) height = window.innerHeight;
    if (!width) width = window.innerWidth;
    let pos = point.clone();
    pos.sub(camera.position);
    let rot = camera.rotation.clone();
    rot.x *= -1;rot.y *= -1;rot.z *= -1;
    pos.applyMatrix3(new Matrix3().set(
      1,0,0,
      0,Math.cos(rot.x),-Math.sin(rot.x),
      0,Math.sin(rot.x), Math.cos(rot.x)
    ));
    pos.applyMatrix3(new Matrix3().set(
       Math.cos(rot.y), 0, Math.sin(rot.y),
      0, 1, 0,
      -Math.sin(rot.y), 0, Math.cos(rot.y)
    ));
    pos.applyMatrix3(new Matrix3().set(
      Math.cos(rot.z),-Math.sin(rot.z), 0,
      Math.sin(rot.z), Math.cos(rot.z), 0,
      0,0,1
    ));
    pos.applyMatrix4(camera.projectionMatrix);
    pos.x = width  * (pos.x * .5 + .5);
    pos.y = height * (.5 - .5 * pos.y);
    pos.z = 0;
    return pos;
  }
}

export { WorldSpaceUI };