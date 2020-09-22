/**
* Wordfind.js 0.0.1
* (c) 2012 Bill, BunKat LLC.
* Wordfind is freely distributable under the MIT license.
* For all details and documentation:
*     http://github.com/bunkat/wordfind
*/

(function (document, $, wordfind) {
  'use strict';

  /**
  * An example game using the puzzles created from wordfind.js. Click and drag
  * to highlight words.
  *
  * WordFindGame requires wordfind.js and jQuery.
  */

    /**
    * Draws the puzzle by inserting rows of buttons into el.
    *
    * @param {String} el: The jQuery element to write the puzzle to
    * @param {[[String]]} puzzle: The puzzle to draw
    */
    var drawPuzzle = function (el, puzzle) {
      var output = '';
      // for each row in the puzzle
      for (var i = 0, height = puzzle.length; i < height; i++) {
        // append a div to represent a row in the puzzle
        var row = puzzle[i];
        output += '<div>';
        // for each element in that row
        for (var j = 0, width = row.length; j < width; j++) {
            // append our button with the appropriate class
            output += '<button class="puzzleSquare" x="' + j + '" y="' + i + '">';
            output += row[j] || '&nbsp;';
            output += '</button>';
        }
        // close our div that represents a row
        output += '</div>';
      }

      $(el).html(output);
    };

    var getWords = function () {
     //return $('input.word').toArray().map(wordEl => wordEl.value.toLowerCase()).filter(word => word);
	  return $('input.word').toArray().map(wordEl => wordEl.id.toLowerCase()).filter(word1 => word1);
    };

    /**
    * Given two points, ensure that they are adjacent and determine what
    * orientation the second point is relative to the first
    *
    * @param {int} x1: The x coordinate of the first point
    * @param {int} y1: The y coordinate of the first point
    * @param {int} x2: The x coordinate of the second point
    * @param {int} y2: The y coordinate of the second point
    */
    var calcOrientation = function (x1, y1, x2, y2) {

      for (var orientation in wordfind.orientations) {
        var nextFn = wordfind.orientations[orientation];
        var nextPos = nextFn(x1, y1, 1);

        if (nextPos.x === x2 && nextPos.y === y2) {
          return orientation;
        }
      }

      return null;
    };


  /**
  * Initializes the WordFindGame object.
  *
  * Creates a new word find game and draws the board and words.
  *
  * Returns the puzzle that was created.
  *
  * @param {String} puzzleEl: Selector to use when inserting the puzzle
  * @param {Options} options: WordFind options to use when creating the puzzle
  */
  var WordFindGame = function (puzzleEl, options) {

    // Class properties, game initial config:
    var wordList, puzzle;

    /**
    * Game play events.
    *
    * The following events handle the turns, word selection, word finding, and
    * game end.
    *
    */

    // Game state
    var startSquare, selectedSquares = [], curOrientation, curWord = '';

    /**
    * Event that handles mouse down on a new square. Initializes the game state
    * to the letter that was selected.
    *
    */
    var startTurn = function () {
      $(this).addClass('selected');
      startSquare = this;
      selectedSquares.push(this);
      curWord = $(this).text();
    };
    
    var touchMove = function(e) {
      var xPos = e.originalEvent.touches[0].pageX;
      var yPos = e.originalEvent.touches[0].pageY;
      var targetElement = document.elementFromPoint(xPos, yPos);
      select(targetElement)
    };
    
    var mouseMove = function() { 
      select(this);
    };

    /**
    * Event that handles mouse over on a new square. Ensures that the new square
    * is adjacent to the previous square and the new square is along the path
    * of an actual word.
    *
    */
    var select = function (target) {
      // if the user hasn't started a word yet, just return
      if (!startSquare) {
        return;
      }

      // if the new square is actually the previous square, just return
      var lastSquare = selectedSquares[selectedSquares.length-1];
      if (lastSquare == target) {
        return;
      }

      // see if the user backed up and correct the selectedSquares state if
      // they did
      var backTo;
      for (var i = 0, len = selectedSquares.length; i < len; i++) {
        if (selectedSquares[i] == target) {
          backTo = i+1;
          break;
        }
      }

      while (backTo < selectedSquares.length) {
        $(selectedSquares[selectedSquares.length-1]).removeClass('selected');
        selectedSquares.splice(backTo,1);
        curWord = curWord.substr(0, curWord.length-1);
      }


      // see if this is just a new orientation from the first square
      // this is needed to make selecting diagonal words easier
      var newOrientation = calcOrientation(
          $(startSquare).attr('x')-0,
          $(startSquare).attr('y')-0,
          $(target).attr('x')-0,
          $(target).attr('y')-0
          );

      if (newOrientation) {
        selectedSquares = [startSquare];
        curWord = $(startSquare).text();
        if (lastSquare !== startSquare) {
          $(lastSquare).removeClass('selected');
          lastSquare = startSquare;
        }
        curOrientation = newOrientation;
      }

      // see if the move is along the same orientation as the last move
      var orientation = calcOrientation(
          $(lastSquare).attr('x')-0,
          $(lastSquare).attr('y')-0,
          $(target).attr('x')-0,
          $(target).attr('y')-0
          );

      // if the new square isn't along a valid orientation, just ignore it.
      // this makes selecting diagonal words less frustrating
      if (!orientation) {
        return;
      }

      // finally, if there was no previous orientation or this move is along
      // the same orientation as the last move then play the move
      if (!curOrientation || curOrientation === orientation) {
        curOrientation = orientation;
        playTurn(target);
      }
    };

    /**
    * Updates the game state when the previous selection was valid.
    *
    * @param {el} square: The jQuery element that was played
    */
    var playTurn = function (square) {

      // make sure we are still forming a valid word
      for (var i = 0, len = wordList.length; i < len; i++) {
        if (wordList[i].indexOf(curWord + $(square).text()) === 0) {
          $(square).addClass('selected');
          selectedSquares.push(square);
          curWord += $(square).text();
          break;
        }
      }
    };

    /**
    * Event that handles mouse up on a square. Checks to see if a valid word
    * was created and updates the class of the letters and word if it was. Then
    * resets the game state to start a new word.
    *
    */
    var endTurn = function () {
      // see if we formed a valid word
      for (var i = 0, len = wordList.length; i < len; i++) {
        
        if (wordList[i] === curWord) {
          $('.selected').addClass('found'+i);
          wordList.splice(i,1);
		  // assil
          $('input.word[id="' + curWord + '"]').addClass('wordFound');
        }

        if (wordList.length === 0) {
          $('.puzzleSquare').addClass('complete');
        }
      }

      // reset the turn
      $('.selected').removeClass('selected');
      startSquare = null;
      selectedSquares = [];
      curWord = '';
      curOrientation = null;
    };

    /* Constructor START */
    $('input.word').removeClass('wordFound');

    // Class properties, game initial config:
    wordList = getWords().sort();
	/* wordList=    ['ænd',
        'wɜːd',
        'skaɪ',
        'peɪst',
        'hɪə',
        "tɛkst",
        'jɔː',
        'peɪst',
        'hɪə',
        'tɛkst',
        'prənaʊns',];*/
    puzzle = wordfind.newPuzzleLax(wordList, options);

    // Draw all of the words
    drawPuzzle(puzzleEl, puzzle);

    // attach events to the buttons
    // optimistically add events for windows 8 touch
    if (window.navigator.msPointerEnabled) {
      $('.puzzleSquare').on('MSPointerDown', startTurn);
      $('.puzzleSquare').on('MSPointerOver', select);
      $('.puzzleSquare').on('MSPointerUp', endTurn);
    } else {
      $('.puzzleSquare').mousedown(startTurn);
      $('.puzzleSquare').mouseenter(mouseMove);
      $('.puzzleSquare').mouseup(endTurn);
      $('.puzzleSquare').on("touchstart", startTurn);
      $('.puzzleSquare').on("touchmove", touchMove);
      $('.puzzleSquare').on("touchend", endTurn);
    }

    /**
    * Solves an existing puzzle.
    *
    * @param {[[String]]} puzzle: The puzzle to solve
    */
    this.solve = function() {
      var solution = wordfind.solve(puzzle, wordList).found;
	var casecouleur = [];
	var caseposition = [];
	var couleurcase = [];
	

	
	var couleur = ['coral','indianred', 'brown', 'chartreuse', 'seagreen', 'lightpink', 'cadetblue', 'rosybrown', 'lightsalmon', 'lightskyblue','lightseagreen','lightcoral','darkred','cyan','khaki','royalblue','peachpuff', 'turquoise', 'fuchsia', 'yellow', 'greenyellow'];
	
      for( var i = 0, len = solution.length; i < len; i++) {
        var word = solution[i].word,
            orientation = solution[i].orientation,
            x = solution[i].x,
            y = solution[i].y,
            next = wordfind.orientations[orientation];

       // var wordEl = $('input.word[value="' + word + '"]');
// assil 	  
	  var wordEl = $('input.word[value="' + word + '"]');
	    var wordEl = $('input.word[Id="' + word + '"]');
	           if (!wordEl.hasClass('wordFound')) {
          for (var j = 0, size = word.length; j < size; j++) {
            var nextPos = next(x, y, j);
			var csssolved = 'solved'||i;
			var actuelX =  nextPos.x;
			var actuelY =  nextPos.y;
		//	var PositionCouleur = actuelX  +","+ actuelY +","+ couleur [i];
			casecouleur.push (actuelX  +","+ actuelY +","+ couleur [i] );
caseposition.push (actuelX  +","+ actuelY);
couleurcase.push (couleur [i]);




			// cercher le couple x y dans le tableau et selon le nombre de foisprendre els couleur 
			
			
            $('[x="' + nextPos.x + '"][y="' + nextPos.y + '"]').addClass('solved' );
          }




	

          wordEl.addClass('wordFound');
        }
      }
	var positiontraite = []; 
var positioncouleur = [];	
	for (var t = 0 , len = caseposition.length ; t < len ; t++)
{
  positiontraite = [];
positiontraite.push (caseposition [t]);
 positioncouleur  = [];
positioncouleur.push (couleurcase [t]);
for (var p = 0 , lena = caseposition.length ; p < lena ; p++)   // p=t+1
{
	var positionfixe = caseposition [t];
	var positiontest = caseposition [p];
	if (caseposition [p] === caseposition [t]	)
	{
		positiontraite.push (caseposition [p]);
		positioncouleur.push (couleurcase [p]);
	}
	}
	const yx = positiontraite[0].split(',');
		var xcolor = yx[0];
		var ycolor = yx[1];
		//dedoublonage positioncouleur couleur

var positioncouleur1 = Array.from(new Set(positioncouleur));		
		
			
		
	if (positioncouleur1.length === 1) {
 
	  $('[x="' + xcolor + '"][y="' + ycolor + '"]').css({background:"linear-gradient(" + positioncouleur1[0] +  "," + positioncouleur1[0]+")" });  

	}
	if (positioncouleur1.length === 2) {
 
	  $('[x="' + xcolor + '"][y="' + ycolor + '"]').css({background:"linear-gradient(" + positioncouleur1[0] +  "," + positioncouleur1[1]+")" });	
	}
		
		if (positioncouleur1.length === 3) {
	
		  $('[x="' + xcolor + '"][y="' + ycolor + '"]').css({background:"linear-gradient(" + positioncouleur1[0] +  "," + positioncouleur1[1]+ "," +positioncouleur1[2]+ ")" });
	}
		if (positioncouleur1.length === 4) {

	 $('[x="' + xcolor + '"][y="' + ycolor + '"]').css({background:"linear-gradient(" + positioncouleur1[0] +  "," + positioncouleur1[1]+ "," +positioncouleur1[2]+  "," +positioncouleur1[3]+  ")" });
	}
		if (positioncouleur1.length === 5) {

	$('[x="' + xcolor + '"][y="' + ycolor + '"]').css({background:"linear-gradient(" + positioncouleur1[0] +  "," + positioncouleur1[1]+ "," +positioncouleur1[2]+  "," +positioncouleur1[3]+ "," +positioncouleur1[4]+ ")" });
	}
	
			if (positiontraite.length === 6) {


		$('[x="' + xcolor + '"][y="' + ycolor + '"]').css({background:"linear-gradient(" + positioncouleur1[0] +  "," + positioncouleur1[1]+ "," +positioncouleur1[2]+  "," +positioncouleur1[3]+ "," +positioncouleur1[4]+ "," +positioncouleur1[5]+   ")" });  
	
	}
	
	
}  
	  
	  
	  
	  
	  
    };
  };

  WordFindGame.emptySquaresCount = function () {
    var allSquares = $('.puzzleSquare').toArray();
    return allSquares.length - allSquares.filter(b => b.textContent.trim()).length;
  };

  // Static method
  WordFindGame.insertWordBefore = function (el, word, wordapi) {
    $('<li><input class="word" value="' + (word || '') + '" id = "' + (wordapi || '') + '" ></li>').insertBefore(el);
  };
   // Static method
  WordFindGame.insertWordBeforetest = function (el, word) {
    
  };



  /**
  * Allow game to be used within the browser
  */
  window.WordFindGame = WordFindGame;

}(document, jQuery, wordfind));
