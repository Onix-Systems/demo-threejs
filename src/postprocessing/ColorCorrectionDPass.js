import {
	ShaderMaterial,
	UniformsUtils,
	Color,
	Vector3
} from 'three';
import { Pass } from 'three/examples/jsm/postprocessing/Pass.js';
import { ColorCorrectionDShader } from '../shaders/ColorCorrectionDShader.js';

var ColorCorrectionDPass = function (tex) {
	Pass.call( this );
	if ( ColorCorrectionDShader === undefined )
		console.error( 'ColorCorrectionDPass relies on ColorCorrectionDShader' );
	var shader = ColorCorrectionDShader;
	this.uniforms = UniformsUtils.clone( shader.uniforms );
	this.material = new ShaderMaterial( {
		uniforms: this.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader

	} );

	this.config = {
		bIntensity: 1,
		fIntensity: 1,
		bTrigger: false, 
		fTrigger: false,
		bColor: 0xffffff,
		fColor: 0xffffff,
	};

	this.update();

	this.uniforms.tMask.value = tex;
	this.uniforms.bIntensity.value = this.config.bIntensity;
	this.uniforms.fIntensity.value = this.config.fIntensity;
	this.fsQuad = new Pass.FullScreenQuad( this.material );
};

ColorCorrectionDPass.prototype = Object.assign( Object.create( Pass.prototype ), {
	constructor: ColorCorrectionDPass,

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

	handleColorForUniform: function(hexColor){
		var c = new Color(hexColor);
		return new Vector3(c.r, c.g, c.b);
	},

	updateUniforms: function () {
		this.uniforms[ 'bColor' ].value = this.handleColorForUniform(this.config.bColor);
		this.uniforms[ 'fColor' ].value = this.handleColorForUniform(this.config.fColor);
		this.uniforms[ 'bIntensity' ].value = (this.config.bTrigger) ? this.config.bIntensity : 0;
		this.uniforms[ 'fIntensity' ].value = (this.config.fTrigger) ? this.config.fIntensity : 0;
	},
} );

export { ColorCorrectionDPass };