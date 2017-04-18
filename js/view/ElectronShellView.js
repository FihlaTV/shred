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
  var Rectangle = require( 'SCENERY/nodes/Rectangle' );
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

    this.innerRing = new ElectronRingNode(
      modelViewTransform.modelToViewDeltaX( atom.innerElectronShellRadius ),

      // The first two electron shell positions from the model go on the inner electron shell ring
      atom.electronShellPositions.slice( 0, 2 ),
      modelViewTransform,
      {
        stroke: 'blue',
        lineWidth: 1.5,
        lineDash: LINE_DASH,
        center: modelViewTransform.modelToViewPosition( { x: 0, y: 0 } ),
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

    this.outerRing = new ElectronRingNode( modelViewTransform.modelToViewDeltaX( atom.outerElectronShellRadius ),

      // The first two electron shell positions from the model go on the inner electron shell ring
      atom.electronShellPositions.slice( 2 ),
      modelViewTransform,
      {
        stroke: 'blue',
        lineWidth: 1.5,
        lineDash: LINE_DASH,
        center: modelViewTransform.modelToViewPosition( { x: 0, y: 0 } ),
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

    this.selectingShellNucleusOptions = false;
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

        if ( self.selectingShellNucleusOptions ) {
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
            self.currentlyDraggedParticle.destinationProperty.set( currentNode.shellNucleusHoverLocations );

            // Update the last focused node
            self.previouslyFocusedNode = currentNode;
          }

          // If key represents 'place' or 'end' condition
          else if ( event.keyCode === Input.KEY_ENTER || event.keyCode === Input.KEY_SPACE ||
                    event.keyCode === Input.KEY_TAB || event.keyCode === Input.KEY_ESCAPE ) {

            // If there is currently a particle that is being dragged
            if ( self.currentlyDraggedParticle && self.currentlySelectedBucketFront ) {


              // TODO: Make conditionals more effecient and easier to read.
              // if the nucleus was selected
              var nucleusOptionIndex = 0;
              if ( self.currentOptionIndex === nucleusOptionIndex || event.keyCode === Input.KEY_TAB ||
                   event.keyCode === Input.KEY_ESCAPE ) {


                if ( event.keyCode === Input.KEY_TAB || event.keyCode === Input.KEY_ESCAPE ) {
                  self.currentlySelectedBucketFront.bucket.addParticleFirstOpen( self.currentlyDraggedParticle, true );
                }
                self.currentlyDraggedParticle.userControlledProperty.set( false );

                // This is to help animate accessible drag
                self.currentlyDraggedParticle.isAccessibleControlled = false;

                // Remove focusability if there are no particles
                if ( self.atom.particleCountProperty.get() === 0 ) {
                  self.focusable = false;
                }

                self.currentlyDraggedParticle = null;

                // // If tab was pressed then don't focus on the bucketFront again. Instead go to the next tab navigable element
                if ( event.keyCode !== Input.KEY_TAB ) {

                  // TODO: Ensure that this is called after all key events meant for the particleAtom are finished. See https://github.com/phetsims/a11y-research/26
                  // put focus back onto the bucketFront
                  setTimeout( function() {
                    self.currentlySelectedBucketFront.focus();
                    self.currentlySelectedBucketFront = null;
                  }, 100 );
                }
                else {
                  self.currentlySelectedBucketFront = null;
                }
              }
              else {

                // No longer selecting the shell or nucleus to place
                self.selectingShellNucleusOptions = false;

                // Not the node for the nucleus, let the out shells handle their own electron selection
                var outerNode = self.shellNucluesOptions[ self.currentOptionIndex ];

                outerNode.chooseElectron( self.currentlyDraggedParticle, self.currentlySelectedBucketFront );
              }
            }
          }
        }
      }
    } );


    // when the nucleus radius changes, redraw the nucleus focus highlight
    atom.nucleusRadiusProperty.link( function( radius ) {
      var radiusOffset = radius === 0 ? 0 : 10;
      self.centerOption.shellNucleusHoverLocations = new Vector2( radius + radiusOffset, 0 );
    } );
  }

  shred.register( 'ElectronShellView', ElectronShellView );


  function ElectronRingNode( radius, electronShellPositions, modelViewTransform, options ) {
    var self = this;

    Circle.call( this, radius, options );

    this.electronShellPositions = electronShellPositions;
    this.electronPlacementNodes = [];

    this.choosingElectronPlacement = false;
    // add circles for each of the electron positions in the outer shells
    for ( var i = 0; i < electronShellPositions.length; i++ ) {

      // the center of the circle will be at the electron shell position, relative to the parent
      // coordinate frame
      var circleCenter = modelViewTransform.modelToViewPosition( electronShellPositions[ i ].position );
      circleCenter = this.parentToLocalPoint( circleCenter );
      
      var circle = new Rectangle( 0, 0, 20, 20, {
        fill: null,
        stroke: 'blue',
        center: circleCenter,

        // a11y
        tagName: 'div',
        focusable: true
      } );


      this.electronPlacementNodes.push( circle );
      this.addChild( circle );
    }
    this.previouslyFocusedElectron = this.electronPlacementNodes[ 0 ];


    this.currentOptionIndex = 0; // private (a11y)
    this.addAccessibleInputListener( {
      keydown: function( event ) {
        if ( self.choosingElectronPlacement && self.activeParticle && self.activeBucketFront ) {

          var isDownRight = event.keyCode === Input.KEY_DOWN_ARROW || event.keyCode === Input.KEY_RIGHT_ARROW;
          var isUpLeft = event.keyCode === Input.KEY_UP_ARROW || event.keyCode === Input.KEY_LEFT_ARROW;


          // if event was an arrow key
          if ( isDownRight || isUpLeft ) {
            if ( isDownRight ) {
              self.currentOptionIndex = ( self.currentOptionIndex + 1 ) % self.electronPlacementNodes.length;
            }
            else if ( isUpLeft ) {
              self.currentOptionIndex = self.currentOptionIndex - 1;
              if ( self.currentOptionIndex < 0 ) { self.currentOptionIndex = self.electronPlacementNodes.length - 1; }
            }

            var currentNode = self.electronPlacementNodes[ self.currentOptionIndex ];
            currentNode.focus();


            //TODO use an offset while selecting.
            // Moving the particle to the current option
            self.activeParticle.destinationProperty.set(
              electronShellPositions[ self.currentOptionIndex ].position );

            // Update the last focused node
            self.previouslyFocusedElectron = currentNode;
          }

          // If key represents 'place' or 'end' condition
          else if ( event.keyCode === Input.KEY_ENTER || event.keyCode === Input.KEY_SPACE ||
                    event.keyCode === Input.KEY_TAB || event.keyCode === Input.KEY_ESCAPE ) {

            self.choosingElectronPlaement = false;
            if ( event.keyCode === Input.KEY_TAB || event.keyCode === Input.KEY_ESCAPE ) {
              self.activeBucketFront.bucket.addParticleFirstOpen( self.activeParticle, true );
            }
            self.activeParticle.userControlledProperty.set( false );

            // This is to help animate accessible drag
            self.activeParticle.isAccessibleControlled = false;

            self.activeParticle = null;

            // // If tab was pressed then don't focus on the bucketFront again. Instead go to the next tab navigable element
            if ( event.keyCode !== Input.KEY_TAB ) {
              //
              // TODO: Ensure that this is called after all key events meant for the particleAtom are finished. See https://github.com/phetsims/a11y-research/26
              // put focus back onto the bucketFront
              setTimeout( function() {
                self.activeBucketFront.focus();
                self.activeBucketFront = null;
              }, 100 );
            }
            else {
              self.activeBucketFront = null;
            }
          }
        }
      }
    } );
  }

  inherit( Circle, ElectronRingNode, {

    chooseElectron: function( particle, bucketFront ) {

      this.activeParticle = particle;
      this.activeBucketFront = bucketFront;

      this.choosingElectronPlacement = true;
      this.electronPlacementNodes.forEach( function( childCircle ) {
        childCircle.accessibleHidden = false;

        childCircle.visible = true;
      } );

      // Moving the particle to the current option
      particle.destinationProperty.set( this.previouslyFocusedElectron.center );

      this.previouslyFocusedElectron.focus();
    }

  } );


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

      this.selectingShellNucleusOptions = true;

      this.accessibleHidden = false;
      this.previouslyFocusedNode.focus();

      // Store the current bucket and particle to be used during selection.
      this.currentlyDraggedParticle = particle;
      this.currentlySelectedBucketFront = bucketFront;
    },

    // @public (a11y)
    getCurrentParticleHoverLocation: function() {
      return this.shellNucluesOptions[ this.currentOptionIndex ].shellNucleusHoverLocations;
    }
  } );

  return ElectronShellView;
} );
