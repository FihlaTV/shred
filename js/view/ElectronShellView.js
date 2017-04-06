// Copyright 2014-2015, University of Colorado Boulder

/**
 * Node that represents the electron shells, aka "orbits", in the view.
 *
 * @author John Blanco
 */

define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var shred = require( 'SHRED/shred' );
  var Tandem = require( 'TANDEM/Tandem' );
  var Circle = require( 'SCENERY/nodes/Circle' );
  var Node = require( 'SCENERY/nodes/Node' );
  var Property = require( 'AXON/Property' );
  var Emitter = require( 'AXON/Emitter' );
  var Vector2 = require( 'DOT/Vector2' );
  var Input = require( 'SCENERY/input/Input' );

  // constants
  var LINE_DASH = [ 4, 5 ];

  /**
   * @param {ParticleAtom} atom
   * @param {ModelViewTransform2} modelViewTransform
   * @param {Object} options
   * @constructor
   */
  function ElectronShellView( atom, modelViewTransform, options ) {
    var self = this;
    options = _.extend( {
        tandem: Tandem.tandemRequired()
      },
      options
    );

    // Call super constructor.
    Node.call( this, {
      pickable: false,
      tandem: options.tandem,

      // a11y
      tagName: 'div',
      ariaRole: 'listbox',
      focusable: true
    } );

    // @private
    this.atom = atom;
    this.modelViewTransform = modelViewTransform;

    // @private (a11y) - emits an event when a placement option has been selected
    this.optionSelectedEmitter = new Emitter();
    this.optionHighlightedEmitter = new Emitter();

    // a11y - when there are no particles in the atom, the shells should not be focusable
    atom.particleCountProperty.link( function( newParticleCount ) {
      self.focusable = newParticleCount > 0;
    } );

    var outerRing = new Circle( modelViewTransform.modelToViewDeltaX( atom.outerElectronShellRadius ), {
      stroke: 'blue',
      lineWidth: 1.5,
      lineDash: LINE_DASH,
      translation: modelViewTransform.modelToViewPosition( { x: 0, y: 0 } ),
      pickable: false,
      tandem: options.tandem.createTandem( 'outerRing' ),

      // a11y
      tagName: 'div',
      ariaRole: 'option',
      accessibleLabel: 'Outer Electron Ring'
    } );

    var innerRing = new Circle( modelViewTransform.modelToViewDeltaX( atom.innerElectronShellRadius ), {
      stroke: 'blue',
      lineWidth: 1.5,
      lineDash: LINE_DASH,
      translation: modelViewTransform.modelToViewPosition( { x: 0, y: 0 } ),
      pickable: false,
      tandem: options.tandem.createTandem( 'innerRing' ),

      //a11y
      tagName: 'div',
      ariaRole: 'option',
      accessibleLabel: 'Inner Electron Ring'
    } );

    // a11y - an invisible node that allows the nucleus to be highlighted.
    var centerOption = new Node( {

      // a11y
      tagName: 'div',
      ariaRole: 'option',
      accessibleLabel: 'Nucleus'
    } );

    // a11y - a focus highlight around the nucleus, will change in size when the particles in the nucleus change
    var nucleusFocusHighlight = new Circle( atom.nucleusRadius, {
      lineWidth: 2,
      stroke: 'red',
      translation: modelViewTransform.modelToViewPosition( { x: 0, y: 0 } )
    } );

    // a11y - a focus highlight for the outer shell
    var electronOuterFocusHighlight = new Circle( atom.outerElectronShellRadius, {
      lineWidth: 2,
      stroke: 'red',
      translation: modelViewTransform.modelToViewPosition( { x: 0, y: 0 } )
    } );

    // a11y - a focus highlight for the inner shell
    var electronInnerFocusHighlight = new Circle( atom.innerElectronShellRadius, {
      lineWidth: 2,
      stroke: 'red',
      translation: modelViewTransform.modelToViewPosition( { x: 0, y: 0 } )
    } );

    // @private (a11y) - the shell/nucleus option that is currently highlighted while placing a particle in the atom
    this.highlightedOptionProperty = new Property( centerOption.accessibleId );

    // Link the property's value to change the focus highlight outlining the different particle placement possibilities.
    this.highlightedOptionProperty.link( function( newValue ) {
      switch( newValue ) {
        case ( centerOption.accessibleId ):
          self.setFocusHighlight( nucleusFocusHighlight );
          break;
        case ( innerRing.accessibleId ):
          self.setFocusHighlight( electronInnerFocusHighlight );
          break;
        case ( outerRing.accessibleId ):
          self.setFocusHighlight( electronOuterFocusHighlight );
          break;
        default:
          throw new Error( 'You tried to set the highlightedOptionProperty to an unsupported value.' );
      }
    } );

    // @private (a11y) - a map of drop locations for particles that are being moved into the atom with a keyboard
    centerOption.particleDropLocation = new Vector2( 0, 0 );
    innerRing.particleDropLocation = new Vector2( atom.innerElectronShellRadius, 0 );
    outerRing.particleDropLocation = new Vector2( atom.outerElectronShellRadius, 0 );

    // @private a11y - set the selectProperty when the arrow keys change the html select menu's value.
    this.optionNodes = [ centerOption, innerRing, outerRing ];

    // @private (a11y)
    this.currentOptionIndex = 0;
    this.addAccessibleInputListener( {
      keydown: function( event ) {
        var isDownRight = event.keyCode === Input.KEY_DOWN_ARROW || event.keyCode === Input.KEY_RIGHT_ARROW;
        var isUpLeft = event.keyCode === Input.KEY_UP_ARROW || event.keyCode === Input.KEY_LEFT_ARROW;

        // if event was an arrow key
        if ( isDownRight || isUpLeft ) {
          if ( isDownRight ) {
            self.currentOptionIndex = ( self.currentOptionIndex + 1 ) % self.optionNodes.length;
          }
          else if ( isUpLeft ) {
            self.currentOptionIndex = self.currentOptionIndex - 1;
            if ( self.currentOptionIndex < 0 ) { self.currentOptionIndex = self.optionNodes.length - 1; }
          }

          // Update highlighting
          var nextElementId = self.optionNodes[ self.currentOptionIndex ].accessibleId;
          self.setAccessibleAttribute( 'aria-activedescendant', nextElementId );

          // Setting the highlighting between the options
          self.highlightedOptionProperty.set( nextElementId );

          // Moving the particle to the current option
          self.optionHighlightedEmitter.emit1( self.optionNodes[ self.currentOptionIndex ] );
        }

        // If key represents 'place' or 'end' condition
        else if ( event.keyCode === Input.KEY_ENTER || event.keyCode === Input.KEY_SPACE ||
                  event.keyCode === Input.KEY_TAB || event.keyCode === Input.KEY_ESCAPE ) {
          self.optionSelectedEmitter.emit1( event.keyCode );
        }
      }
    } );

    // add each node to the view
    this.optionNodes.forEach( function( node ) { self.addChild( node ); } );

    // when the nucleus radius changes, redraw the nucleus focus highlight
    atom.nucleusRadiusProperty.link( function( radius ) {
      var radiusOffset = radius === 0 ? 0 : 4;
      nucleusFocusHighlight.radius = radius + radiusOffset;
    } );
  }

  shred.register( 'ElectronShellView', ElectronShellView );

  // Inherit from Node.
  return inherit( Node, ElectronShellView, {

    // @public (a11y)
    handleAccessibleDrag: function( particle, bucketFront ) {
      var self = this;

      // focus the select option
      this.focusable = true;
      this.focus();

      // Change the highlight to match the placement option
      var optionHighlightedListener = function( node ) {
        particle.positionProperty.set( node.particleDropLocation );
      };
      this.optionHighlightedEmitter.addListener( optionHighlightedListener );

      // when an option is selected, place the particle
      var optionSelectedListener = function( keyCode ) {

        // Remove listeners so they don't get called on the next particle being placed
        self.optionSelectedEmitter.removeListener( optionSelectedListener );
        self.optionHighlightedEmitter.removeListener( optionHighlightedListener );

        particle.userControlledProperty.set( false );

        // TODO: move this into the if statement when we decide to implement removal of particles from the particleAtom.
        // Remove focusability if there are no particles
        // if ( self.atom.particleCountProperty.get() === 0 ) {
        // }
        self.focusable = false;

        // If tab was pressed then don't focus on the bucketFront again. Instead go to the next tab navigable element
        if ( keyCode !== Input.KEY_TAB ) {

          // TODO: Ensure that this is called after all key events meant for the particleAtom are finished. See https://github.com/phetsims/a11y-research/26
          // put focus back onto the bucketFront
          setTimeout( function() { bucketFront.focus(); }, 100 );
        }
      };
      this.optionSelectedEmitter.addListener( optionSelectedListener );
    },

    // @public (a11y)
    getCurrentParticleDropLocation: function() {
      return this.optionNodes[ this.currentOptionIndex ].particleDropLocation;
    }
  } );
} );
