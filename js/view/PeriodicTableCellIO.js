// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var assertInstanceOf = require( 'ifphetio!PHET_IO/assertInstanceOf' );
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );
  var shred = require( 'SHRED/shred' );
  var NodeIO = require( 'SCENERY/nodes/NodeIO' );

  /**
   *
   * @param {PeriodicTableCell} periodicTableCell
   * @param {string} phetioID
   * @constructor
   */
  function PeriodicTableCellIO( periodicTableCell, phetioID ) {
    assert && assertInstanceOf( periodicTableCell, phet.shred.PeriodicTableCell );
    NodeIO.call( this, periodicTableCell, phetioID );
  }

  phetioInherit( NodeIO, 'PeriodicTableCellIO', PeriodicTableCellIO, {}, {
    documentation: 'The type that wraps a periodic table cell.',
    events: [ 'fired' ],

    fromStateObject: function( stateObject ) {
      return new phet.dot.Vector2( stateObject.x, stateObject.y );
    },

    toStateObject: function( periodicTableCell ) {
      assert && assertInstanceOf( periodicTableCell, phet.shred.PeriodicTableCell );
      return { x: periodicTableCell.x, y: periodicTableCell.y };
    }
  } );

  shred.register( 'PeriodicTableCellIO', PeriodicTableCellIO );

  return PeriodicTableCellIO;
} );

