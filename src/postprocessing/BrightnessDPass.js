import {
	ShaderMaterial,
	UniformsUtils,
} from 'three';
import { Pass } from 'three/examples/jsm/postprocessing/Pass.js';
import { BrightnessDShader } from '../shaders/BrightnessDShader.js';

var BrightnessDPass = function (tex) {
	Pass.call( this );
	if ( BrightnessDShader === undefined )
		console.error( 'BrightnessDPass relies on BrightnessDShader' );
	var shader = BrightnessDShader;
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
	this.fsQuad = new Pass.FullScreenQuad( this.material );
};

BrightnessDPass.prototype = Object.assign( Object.create( Pass.prototype ), {
	constructor: BrightnessDPass,

	render: function ( renderer, writeBuffer, readBuffer, /* deltaTime, maskActive */ ) {
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

} );

export { BrightnessDPass };