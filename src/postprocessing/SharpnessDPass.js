import {
	ShaderMaterial,
	UniformsUtils,
} from 'three';
import { Pass } from 'three/examples/jsm/postprocessing/Pass.js';
import { SharpnessDShader } from '../shaders/SharpnessDShader.js';

var SharpnessDPass = function (tex) {
	Pass.call( this );
	if ( SharpnessDShader === undefined )
		console.error( 'SharpnessDPass relies on SharpnessDShader' );
	var shader = SharpnessDShader;
	this.uniforms = UniformsUtils.clone( shader.uniforms );
	this.material = new ShaderMaterial( {
		uniforms: this.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader

	} );

	this.config = {
		bIntensity: 0,
		fIntensity: 0,
		bTrigger: false, 
		fTrigger: false,
	};

	this.update();

	this.uniforms.tMask.value = tex;
	this.uniforms.bIntensity.value = this.config.bIntensity;
	this.uniforms.fIntensity.value = this.config.fIntensity;
	this.uniforms.width.value = window.innerWidth;
	this.uniforms.height.value = window.innerHeight;
	this.fsQuad = new Pass.FullScreenQuad( this.material );
};

SharpnessDPass.prototype = Object.assign( Object.create( Pass.prototype ), {
	constructor: SharpnessDPass,

	render: function ( renderer, writeBuffer, readBuffer, /*deltaTime , maskActive */ ) {
		this.uniforms[ 'tDiffuse' ].value = readBuffer.texture;
		
		if ( this.renderToScreen ) {
			renderer.setRenderTarget( null );
			this.fsQuad.render( renderer );
		} else {
			renderer.setRenderTarget( writeBuffer );
			if ( this.clear ) renderer.clear();
			this.fsQuad.render( renderer );
		}
	},

	update: function() {
		this.updateUniforms();
		this.enabled = this.config.bTrigger || this.config.fTrigger;
	},

	updateUniforms: function () {
		this.uniforms[ 'bIntensity' ].value = (this.config.bTrigger) ? this.config.bIntensity : 0;
		this.uniforms[ 'fIntensity' ].value = (this.config.fTrigger) ? this.config.fIntensity : 0;
	},

	setSize: function(width, height){
		this.uniforms[ 'width' ].value = width;
		this.uniforms[ 'height' ].value = height;
	}

	

} );

export { SharpnessDPass };