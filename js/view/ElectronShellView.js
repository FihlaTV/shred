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

    // a11y - to focus around the actual nucleus, will change in size when the particles in the nucleus change
    var nucleusFocusHighlight = new Circle( atom.nucleusRadius, {
      lineWidth: 2,
      stroke: 'red',
      translation: modelViewTransform.modelToViewPosition( { x: 0, y: 0 } )
    } );

    // a11y - to focus around the outer shell
    var electronOuterFocusHighlight = new Circle( atom.outerElectronShellRadius, {
      lineWidth: 2,
      stroke: 'red',
      translation: modelViewTransform.modelToViewPosition( { x: 0, y: 0 } )
    } );

    // a11y - to focus around the inner shell
    var electronInnerFocusHighlight = new Circle( atom.innerElectronShellRadius, {
      lineWidth: 2,
      stroke: 'red',
      translation: modelViewTransform.modelToViewPosition( { x: 0, y: 0 } )
    } );

    // @private
    this.selectValueProperty = new Property( centerOption.accessibleId );

    // Link the property's value to change the focus highlight outlining the different particle placement possibilities.
    this.selectValueProperty.link( function( newValue ) {
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
          throw new Error( 'You tried to set the selectValueProperty to an unsupported value.' );
      }
    } );

    centerOption.choosingLocation = new Vector2( 0, 0 );
    innerRing.choosingLocation = new Vector2( atom.innerElectronShellRadius, 0 );
    outerRing.choosingLocation = new Vector2( atom.outerElectronShellRadius, 0 );

    // a11y - set the selectProperty when the arrow keys change the html select menu's value.
    var optionNodes = [ centerOption, innerRing, outerRing ];

    // @private (a11y)
    this.currentOptionIndex = 0;
    this.addAccessibleInputListener( {
      keydown: function( event ) {
        var isDownRight = event.keyCode === Input.KEY_DOWN_ARROW || event.keyCode === Input.KEY_RIGHT_ARROW;
        var isUpLeft = event.keyCode === Input.KEY_UP_ARROW || event.keyCode === Input.KEY_LEFT_ARROW;

        // if event was an arrow key
        if ( isDownRight || isUpLeft ) {
          if ( isDownRight ) {
            self.currentOptionIndex = ( self.currentOptionIndex + 1 ) % optionNodes.length;
          }
          else if ( isUpLeft ) {
            self.currentOptionIndex = self.currentOptionIndex - 1;
            if ( self.currentOptionIndex < 0 ) { self.currentOptionIndex = optionNodes.length - 1; }
          }

          // Update highlighting
          var nextElementId = optionNodes[ self.currentOptionIndex ].accessibleId;
          self.setAccessibleAttribute( 'aria-activedescendant', nextElementId );
          self.selectValueProperty.set( nextElementId );
          self.optionHighlightedEmitter.emit1( optionNodes[ self.currentOptionIndex ] );
        }

        // If key represents 'place' or 'end' condition
        else if ( event.keyCode === Input.KEY_ENTER || event.keyCode === Input.KEY_SPACE ||
                  event.keyCode === Input.KEY_TAB || event.keyCode === Input.KEY_ESCAPE ) {
          self.optionSelectedEmitter.emit1( event.keyCode );
        }

      }
    } );

    // add each node to the view
    optionNodes.forEach( function( node ) { self.addChild( node ); } );

    // whenever a nucleon is added or removed, change the highlight radius
    Property.multilink( [ atom.protonCountProperty, atom.neutronCountProperty ], function( protonCount, neutronCount ) {

      // TODO: Is there another way to link to the changing nucleus configuration
      atom.reconfigureNucleus();
      var radiusOffset = atom.nucleusRadius === 0 ? 0 : 4;
      nucleusFocusHighlight.radius = atom.nucleusRadius + radiusOffset;
    } );
  }

  shred.register( 'ElectronShellView', ElectronShellView );

  // Inherit from Node.
  return inherit( Node, ElectronShellView, {

    handleAccessibleDrag: function( particle, bucketFront ) {
      var self = this;

      // focus the select option
      this.focusable = true;
      this.focus();

      // Change the highlight to match the placement option
      var optionHighlightedListener = function( node ) {
        particle.positionProperty.set( node.choosingLocation );
      };
      this.optionHighlightedEmitter.addListener( optionHighlightedListener );

      // when an option is selected, place the particle
      var optionSelectedListener = function( keyCode ) {

        // Remove listeners so they don't get called on the next particle being placed
        self.optionSelectedEmitter.removeListener( optionSelectedListener );
        self.optionHighlightedEmitter.removeListener( optionHighlightedListener );

        // Reset the option index
        self.currentOptionIndex = 0;
        particle.userControlledProperty.set( false );

        // Remove focusability if there are no particles
        // if ( self.atom.particleCountProperty.get() === 0 ) {
        // }

        // TODO: move this up to the if statement when we decide to implement removal of particles from the particleAtom.
        self.focusable = false;


        // If tab was pressed then don't focus on the bucketFront again. Instead go to the next tab navigable element
        if (keyCode !== Input.KEY_TAB){

          // TODO: Ensure that this is called after all key events meant for the particleAtom are finished. See https://github.com/phetsims/a11y-research/26
          // put focus back onto the bucketFront
          setTimeout( function() { bucketFront.focus(); }, 100 );
        }
      };
      this.optionSelectedEmitter.addListener( optionSelectedListener );
    }
  } );
} );
