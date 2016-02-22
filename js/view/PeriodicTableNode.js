// Copyright 2015, University of Colorado Boulder

/**
 * Scenery node that defines a periodic table of the elements.
 */
define( function( require ) {
  'use strict';

  var shred = require( 'SHRED/shred' );
  var Node = require( 'SCENERY/nodes/Node' );
  var inherit = require( 'PHET_CORE/inherit' );
  var Vector2 = require( 'DOT/Vector2' );
  var PeriodicTableCell = require( 'SHRED/view/PeriodicTableCell' );
  var SharedConstants = require( 'SHRED/SharedConstants' );

  // constants
  // 2D array that defines the table structure.
  var POPULATED_CELLS = [
    [ 0, 17 ],
    [ 0, 1, 12, 13, 14, 15, 16, 17 ],
    [ 0, 1, 12, 13, 14, 15, 16, 17 ],
    [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17 ],
    [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17 ],
    [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17 ],
    [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17 ]
  ];
  var ENABLED_CELL_COLOR = SharedConstants.DISPLAY_PANEL_BACKGROUND_COLOR;
  var DISABLED_CELL_COLOR = '#EEEEEE';
  var SELECTED_CELL_COLOR = '#FA8072'; //salmon

  /**
   * Constructor.
   *
   * @param {NumberAtom} numberAtom - Atom that defines which element is currently highlighted.
   * @param {Object} [options]
   * @constructor
   */
  function PeriodicTableNode( numberAtom, options ) {
    options = _.extend( {
      interactiveMax: 0, //Atomic number of the heaviest element that should be interactive
      cellDimension: 25,
      showLabels: true,
      enabledCellColor: ENABLED_CELL_COLOR,
      disabledCellColor: DISABLED_CELL_COLOR,
      selectedCellColor: SELECTED_CELL_COLOR,
      tandem: null
    }, options );

    Node.call( this ); // Call super constructor.
    var thisPeriodicTable = this;

    // Add the cells of the table.
    this.cells = []; // @private
    var elementIndex = 1;
    var rowGroupTandem = options.tandem && options.tandem.createGroupTandem( 'row' );
    for ( var i = 0; i < POPULATED_CELLS.length; i++ ) {
      var populatedCellsInRow = POPULATED_CELLS[ i ];
      var rowTandem = rowGroupTandem && rowGroupTandem.createNextTandem();
      var columnGroupTandem = rowTandem && rowTandem.createGroupTandem( 'column' );
      var cellColor = {
        'enabled': options.enabledCellColor,
        'disabled': options.disabledCellColor,
        'selected': options.selectedCellColor
      };
      for ( var j = 0; j < populatedCellsInRow.length; j++ ) {
        var cell = new PeriodicTableCell( elementIndex, numberAtom, cellColor, {
          tandem: columnGroupTandem && columnGroupTandem.createNextTandem(),
          interactive: elementIndex <= options.interactiveMax,
          showLabels: options.showLabels,
          length: options.cellDimension
        } );
        cell.translation = new Vector2( populatedCellsInRow[ j ] * options.cellDimension, i * options.cellDimension );
        this.addChild( cell );
        this.cells.push( cell );
        elementIndex++;
        if ( elementIndex === 58 ) {
          elementIndex = 72;
        }
        if ( elementIndex === 90 ) {
          elementIndex = 104;
        }
      }
    }

    // Highlight the cell that corresponds to the atom.
    var highlightedCell = null;
    numberAtom.protonCountProperty.link( function( protonCount ) {
      if ( highlightedCell !== null ) {
        highlightedCell.setHighlighted( false );
      }
      if ( protonCount > 0 && protonCount <= 118 ) {
        var elementIndex = protonCount;
        if ( protonCount >= 72 ) {
          elementIndex = elementIndex - 14;
        }
        if ( protonCount >= 104 && protonCount <= 118 ) {
          elementIndex = elementIndex - 14;
        }
        highlightedCell = thisPeriodicTable.cells[ elementIndex - 1 ];
        highlightedCell.moveToFront();
        highlightedCell.setHighlighted( true );
      }
    } );
  }

  shred.register( 'PeriodicTableNode', PeriodicTableNode );
  // Inherit from Node.
  return inherit( Node, PeriodicTableNode );
} );
