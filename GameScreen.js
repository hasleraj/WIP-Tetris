/* globals createjs */
/*jshint browser:true */
/*jshint devel:true */
/*globals AssetManager */
/*jshint esversion: 6 */
/* globals Tetrominoe */
/* globals Grid */
/* globals IntroScreen */
/* globals MoverDirection*/
var GameScreen = function (assetManager, stage, myIntroScreen) {
    var me = this;
    var eventScreenComplete = new CustomEvent("contentFinished");

    //construct container object
    var screen = new createjs.Container();
    var frameRate = 24;
    var introScreen;

    //initialize keys, no keys pressed
    var downKey = false;
    var upKey = false;
    var leftKey = false;
    var rightKey = false;
    var spaceKey = false;

    var tetro = null;
    //setup event listeners for keyboard
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("keydown", onKeyDown);

    var pause = false;
    var grid = null;
    var pieceBag = [];
    var oldTetros = [];
    var score;
    var scoreText = null;
    var levelText = null;
    var rowsRemainingText = null;
    var level;
    var rowsRemaining;
    var speed;
    
    /************** Grid Background Setup **************/
    var gridBackground = assetManager.getSprite("assets");
    gridBackground.gotoAndStop("grid");
    gridBackground.x = 30;
    gridBackground.y = 0;
    screen.addChildAt(gridBackground, 0);
    
    /************** Play Again Button Setup **************/
    var btnPlayAgain = assetManager.getSprite("assets");
    btnPlayAgain.gotoAndStop("btnPlayUp");
    btnPlayAgain.x = 60;
    btnPlayAgain.y = 515;
    btnPlayAgain.buttonHelper = new createjs.ButtonHelper(btnPlayAgain, "btnResetUp", "btnResetDown", "btnResetDown", false);
    screen.addChild(btnPlayAgain);
    btnPlayAgain.addEventListener("click", onClickPlayAgain);
    
    /************** Back Button Setup **************/
    var btnBack = assetManager.getSprite("assets");
    btnBack.gotoAndStop("btnMenuUp");
    btnBack.x = 300;
    btnBack.y = 515;
    btnBack.buttonHelper = new createjs.ButtonHelper(btnBack, "btnMenuUp", "btnMenuDown", "btnMenuDown", false);
    screen.addChild(btnBack);
    btnBack.addEventListener("click", onClickMain);

    /************** Game Over **************/
    var txtGameOver = assetManager.getSprite("assets");
    txtGameOver.gotoAndStop("gameOver");
    txtGameOver.x = 60;
    txtGameOver.y = 160;

    function gameOver() {
        createjs.Sound.play("gameOver");
        stage.addChild(txtGameOver);
    }

    /************** Private Methods **************/

    function nextPiece() {
        if (pieceBag.length === 0) {
            //28 pieces in the tetrominoe bag
            pieceBag = ["J", "J", "J", "J", "O", "O", "O", "O", "T", "T", "T", "T", "L", "L", "L", "L", "S", "S", "S", "S", "Z", "Z", "Z", "Z", "I", "I", "I", "I"];
        }

        //remove a single random piece
        var selected = pieceBag.splice(Math.floor(Math.random() * pieceBag.length), 1)[0];

        // create a tetro from it and return it.
        var tetro = new Tetrominoe(stage, assetManager, selected, grid, gridBackground.x, gridBackground.y);
        tetro.setSpeed(speed);
        return tetro;
    }
    
    function checkGrid() {
        // Loops through the grid and finds any horizontal rows where every
        // value is true, this is a completed row and should be scored and removed.
        var completedRows = grid.getCompletedRows();

        //if 4 rows complete play different sound than if 3 or less lines complete
        if(completedRows.length === 4) {
            createjs.Sound.play("tetris");
        } else if(completedRows.length > 0 && completedRows.length < 4) {
            createjs.Sound.play("line");
        }
        //console.log("completedRows: " + JSON.stringify(completedRows));

        // Loop awards points for and deletes completed rows
        for(var r = 0; r < completedRows.length; r++) {
            score = score + 10;
            rowsRemaining--;
            
            if(rowsRemaining === 0){
                level++;
                rowsRemaining = 10;
                speed += 2;
                tetro.setSpeed(speed);
            }
            
            //update all displayed text
            scoreText.text = score.toString();
            levelText.text = level.toString();
            rowsRemainingText.text = rowsRemaining.toString();
            
            var row = completedRows[r] - r; //subtract the r, because one row from the grid has been removed for each time this has looped
            grid.shiftRow(row);
        }

        // Check if the grid is ready to have another piece added or not.
        if(grid.isFull()) {
            // Game over
            gameOver();
            pause = true;
        }
    }

    /************** Public Methods **************/
    this.onSetup = function () {
        scoreText = new createjs.Text("0", "32px VT323", "#ffffff");
        scoreText.x = 465;
        scoreText.y = 115;
        scoreText.textBaseline = "alphabetic";
        stage.addChild(scoreText);
        
        levelText = new createjs.Text("1", "32px VT323", "#ffffff");
        levelText.x = 465;
        levelText.y = 235;
        levelText.textBaseline = "alphabetic";
        stage.addChild(levelText);
        
        rowsRemainingText = new createjs.Text("10", "32px VT323", "#ffffff");
        rowsRemainingText.x = 455;
        rowsRemainingText.y = 355;
        rowsRemainingText.textBaseline = "alphabetic";
        stage.addChild(rowsRemainingText);
        
        pause = false;
        score = 0;
        level = 1;
        rowsRemaining = 10;
        speed = 0;
        grid = new Grid(stage);
        introScreen = myIntroScreen;
        tetro = nextPiece();
    };

    this.showMe = function () {
        stage.addChild(screen);
        this.onSetup();
        // startup the ticker
        createjs.Ticker.setFPS(frameRate);
        createjs.Ticker.addEventListener("tick", onTick);
    };

    this.hideMe = function () {
        stage.removeChild(screen);
    };

    /************** Event Handlers **************/
    function onTick(e) {
        document.getElementById("fps").innerHTML = createjs.Ticker.getMeasuredFPS();

        if(pause) return;

        if (leftKey) {
            tetro.changeColumn(MoverDirection.LEFT);
            leftKey = false;
        } else if (rightKey) {
            tetro.changeColumn(MoverDirection.RIGHT);
            rightKey = false;
        } else if (upKey) {
            tetro.rotateMe();
            upKey = false;
        } else if (downKey) {
            tetro.changeRow(MoverDirection.DOWN);
            downKey = false;
        } else if (spaceKey) {
            tetro.dropMe();
            spaceKey = false;
        }

        if (tetro.isActive()) {
            tetro.updateMe();
        } else {
            checkGrid();
            oldTetros.push(tetro);
            tetro = nextPiece();
        }
    }

    function onReset(e) {
        createjs.Sound.play("mouseClick");
        pause = false;

        tetro.destroyMe();
        tetro = null;

        oldTetros.forEach(function(t) { t.destroyMe(); });
        oldTetros = [];

        pieceBag = [];
        grid.reset();
        stage.removeChild(txtGameOver);
        stage.removeChild(scoreText);
        stage.removeChild(levelText);
        stage.removeChild(rowsRemainingText);
        pause = true;

    }
    
    function onClickMain(e) {
        createjs.Sound.play("mouseClick");
        onReset();
        eventScreenComplete.buttonNumber = 0;
        stage.dispatchEvent(eventScreenComplete);
    }
    
    function onClickPlayAgain(e) {
        onReset();
        me.onSetup();
    }

    function onKeyDown(e) {
        if (e.keyCode == 37) leftKey = true;
        else if (e.keyCode == 39) rightKey = true;
        else if (e.keyCode == 38) upKey = true;
        else if (e.keyCode == 40) downKey = true;
        else if (e.keyCode == 32) spaceKey = true;

    }

    function onKeyUp(e) {
        if (e.keyCode == 37) leftKey = false;
        else if (e.keyCode == 39) rightKey = false;
        else if (e.keyCode == 38) upKey = false;
        else if (e.keyCode == 40) downKey = false;
        else if (e.keyCode == 32) spaceKey = false;
    }

};