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
  var Path = require( 'SCENERY/nodes/Path' );
  var Shape = require( 'KITE/Shape' );
  var Node = require( 'SCENERY/nodes/Node' );
  var Vector2 = require( 'DOT/Vector2' );
  var FocusOverlay = require( 'SCENERY/overlays/FocusOverlay' );
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
      tagName: 'ul',
      ariaRole: 'listbox'
    } );

    // @private
    this.atom = atom;
    this.modelViewTransform = modelViewTransform;


    // a11y - a focus highlight around the nucleus
    var shellCenter = new Vector2( 0, 0 );
    var nucleusFocusHighlight = new Circle( atom.nucleusRadiusProperty.get() * 5, {
      fill: FocusOverlay.focusColor,
      stroke: FocusOverlay.innerFocusColor,
      center: modelViewTransform.modelToViewPosition( shellCenter )
    } );

    // a11y - focus highlight donuts that surround the electron shells.
    var electronOuterFocusHighlight = new DonutNode( shellCenter, atom.outerElectronShellRadius );
    var electronInnerFocusHighlight = new DonutNode( shellCenter, atom.innerElectronShellRadius );


    // a11y - an invisible node that allows the nucleus to be highlighted.
    this.centerOption = new Node( {

      // a11y
      tagName: 'div',
      ariaRole: 'option',
      accessibleLabel: 'Nucleus',
      focusable: true,
      focusHighlight: nucleusFocusHighlight
    } );
    this.addChild( this.centerOption );

    this.innerRing = new Circle( modelViewTransform.modelToViewDeltaX( atom.innerElectronShellRadius ), {
      stroke: 'blue',
      lineWidth: 1.5,
      lineDash: LINE_DASH,
      translation: modelViewTransform.modelToViewPosition( { x: 0, y: 0 } ),
      pickable: false,
      tandem: options.tandem.createTandem( 'innerRing' ),

      //a11y
      tagName: 'li',
      ariaRole: 'option',
      accessibleLabel: 'Inner Electron Ring',
      focusable: true,
      focusHighlight: electronInnerFocusHighlight
    } );
    this.addChild( this.innerRing );

    this.outerRing = new Circle( modelViewTransform.modelToViewDeltaX( atom.outerElectronShellRadius ), {
      stroke: 'blue',
      lineWidth: 1.5,
      lineDash: LINE_DASH,
      translation: modelViewTransform.modelToViewPosition( { x: 0, y: 0 } ),
      pickable: false,
      tandem: options.tandem.createTandem( 'outerRing' ),

      // a11y
      tagName: 'li',
      ariaRole: 'option',
      accessibleLabel: 'Outer Electron Ring',
      focusable: true,
      focusHighlight: electronOuterFocusHighlight
    } );
    this.addChild( this.outerRing );

    this.previouslyFocusedNode = this.centerOption;

    // @private a11y - set the selectProperty when the arrow keys change the html select menu's value.
    this.shellNucluesOptions = [ this.centerOption, this.innerRing, this.outerRing ];

    // // @private (a11y) - a map of drop locations for particles that are being moved into the atom with a keyboard
    this.centerOption.shellNucleusHoverLocations = new Vector2( 0, 0 );
    this.innerRing.shellNucleusHoverLocations = new Vector2( atom.innerElectronShellRadius + 10, 0 );
    this.outerRing.shellNucleusHoverLocations = new Vector2( atom.outerElectronShellRadius + 10, 0 );

    this.currentOptionIndex = 0;
    this.addAccessibleInputListener( {
      keydown: function( event ) {
        var isDownRight = event.keyCode === Input.KEY_DOWN_ARROW || event.keyCode === Input.KEY_RIGHT_ARROW;
        var isUpLeft = event.keyCode === Input.KEY_UP_ARROW || event.keyCode === Input.KEY_LEFT_ARROW;

        // if event was an arrow key
        if ( isDownRight || isUpLeft ) {
          if ( isDownRight ) {
            self.currentOptionIndex = ( self.currentOptionIndex + 1 ) % self.shellNucluesOptions.length;
          }
          else if ( isUpLeft ) {
            self.currentOptionIndex = self.currentOptionIndex - 1;
            if ( self.currentOptionIndex < 0 ) { self.currentOptionIndex = self.shellNucluesOptions.length - 1; }
          }

          var currentNode = self.shellNucluesOptions[ self.currentOptionIndex ];
          currentNode.focus();

          // Moving the particle to the current option
          self.currentlyDraggedParticle.destinationProperty.set(
            currentNode.shellNucleusHoverLocations );

          // Update the last focused node
          self.previouslyFocusedNode = currentNode;
        }

        // If key represents 'place' or 'end' condition
        else if ( event.keyCode === Input.KEY_ENTER || event.keyCode === Input.KEY_SPACE ||
                  event.keyCode === Input.KEY_TAB || event.keyCode === Input.KEY_ESCAPE ) {
          if ( self.currentlyDraggedParticle && self.currentlySelectedBucket ) {

            if ( event.keyCode === Input.KEY_TAB || event.keyCode === Input.KEY_ESCAPE ) {
              self.currentlySelectedBucket.bucket.addParticleFirstOpen( self.currentlyDraggedParticle, true );
            }
            self.currentlyDraggedParticle.userControlledProperty.set( false );

            // This is to help animate accessible drag
            self.currentlyDraggedParticle.isAccessibleControlled = false;

            // Remove focusability if there are no particles
            if ( self.atom.particleCountProperty.get() === 0 ) {
              self.focusable = false;
            }

            // // If tab was pressed then don't focus on the bucketFront again. Instead go to the next tab navigable element
            if ( event.keyCode !== Input.KEY_TAB ) {
              //
              // TODO: Ensure that this is called after all key events meant for the particleAtom are finished. See https://github.com/phetsims/a11y-research/26
              // put focus back onto the bucketFront
              setTimeout( function() { self.currentlySelectedBucket.focus(); }, 100 );
            }
          }
        }
      }
    } );


    // TODO Implement specific particle placement in shells with these circle nodes.
    // // add circles for each of the electron positions in the outer shells
    // var circle;
    // for ( var i = 0; i < 2; i++ ) {
    //   circle = new Circle( 10, {
    //     fill: null,
    //     stroke: 'blue',
    //     center: modelViewTransform.modelToViewPosition( this.atom.electronShellPositions[ i ].position )
    //   } );
    //   electronInnerFocusHighlight.addChild( circle );
    // }
    //
    // for ( var j = 2; j < this.atom.electronShellPositions.length; j++ ) {
    //   circle = new Circle( 10, {
    //     fill: null,
    //     stroke: 'blue',
    //     center: modelViewTransform.modelToViewPosition( this.atom.electronShellPositions[ j ].position )
    //   } );
    //   electronOuterFocusHighlight.addChild( circle );
    // }


    // when the nucleus radius changes, redraw the nucleus focus highlight
    atom.nucleusRadiusProperty.link( function( radius ) {
      var radiusOffset = radius === 0 ? 0 : 10;
      self.centerOption.shellNucleusHoverLocations = new Vector2( radius + radiusOffset, 0 );
    } );
  }

  shred.register( 'ElectronShellView', ElectronShellView );


  /**
   * Draws a 'donut' shape, like a 2-D torus.  The donut has an inner circle that is surrounded by two dashed lines
   * that make up the stroke.
   *
   * @param {Vector2} center
   * @param {number} radius
   * @param {object} options
   */
  function DonutNode( center, radius, options ) {

    options = _.extend( {
      glazeColor: FocusOverlay.innerFocusColor,
      doughColor: FocusOverlay.focusColor,
      innerWidth: 9 // width of the dough, the circle in between the dashed lines
    } );

    Node.call( this, options );

    // the dough
    var innerPath = new Path( Shape.circle( center, radius ), {
      fill: null,
      stroke: options.doughColor,
      lineWidth: options.innerWidth
    } );

    // outer glaze
    var outerGlaze = new Path( Shape.circle( center, radius + options.innerWidth / 2 ), {
      fill: null,
      stroke: options.glazeColor
    } );

    // inner glaze
    var innerGlaze = new Path( Shape.circle( center, radius - options.innerWidth / 2 ), {
      fill: null,
      stroke: options.glazeColor
    } );

    this.children = [ innerPath, outerGlaze, innerGlaze ];
  }

  inherit( Node, DonutNode );


  // Inherit from Node.
  inherit( Node, ElectronShellView, {

    /**
     * @public (ally)
     * @param particle
     * @param bucketFront
     */
    accessibleSelect: function( particle, bucketFront ) {

      this.accessibleHidden = false;
      this.previouslyFocusedNode.focus();

      // Store the current bucket and particle to be used during selection.
      this.currentlyDraggedParticle = particle;
      this.currentlySelectedBucket = bucketFront;
    },

    // @public (a11y)
    getCurrentParticleHoverLocation: function() {
      return this.shellNucluesOptions[ this.currentOptionIndex ].shellNucleusHoverLocations;
    }
  } );

  return ElectronShellView;
} );
