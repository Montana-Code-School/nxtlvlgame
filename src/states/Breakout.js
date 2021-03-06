import Phaser from 'phaser';

export default class Breakout extends Phaser.State {
  constructor () {
    super();
    this.score = 0;
  }
  preload () {
    this.load.image('paddle', 'assets/breakout/paddle.png');
    this.load.image('brick', 'assets/luigi/star.png');
    this.load.image('sky', 'assets/breakout/starsBG.png');
    this.load.image('ball', 'assets/breakout/ball.png');
    this.load.audio('hit', 'assets/audio/snare.wav');
    this.load.audio('music', 'assets/audio/hightail.mp3');
    this.load.audio('boom', 'assets/Menu/explosion.wav');
    this.load.audio('win', 'assets/Menu/ta-da.wav');
    this.load.audio('padhit', 'assets/audio/kick.wav');
  }

  create () {
    this.stage.backgroundColor = '#4F77A2';
    this.add.sprite(0, 0, 'sky');
    this.hitSound = this.add.audio('hit');
    this.music = this.add.audio('music');
    this.dieSound = this.add.audio('boom');
    this.winSound = this.add.audio('win');
    this.padHit = this.add.audio('padhit');

    this.music.play();
    this.scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#999' });
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.world.enableBody = true;

    this.left = this.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    this.right = this.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
    this.escape = this.input.keyboard.addKey(Phaser.Keyboard.ESC);

    this.paddle = this.add.sprite(200, 550, 'paddle');
    this.paddle.body.immovable = true;
    this.paddle.body.collideWorldBounds = true;

    this.bricks = this.add.group();
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 3; j++) {
        let brick = this.add.sprite(100 + i * 60, 55 + j * 35, 'brick');
        brick.body.immovable = true;
        this.bricks.add(brick);
      }
    }
    this.ball = this.add.sprite(200, 500, 'ball');
    this.ball.body.velocity.x = 260;
    this.ball.body.velocity.y = 250;
    this.ball.body.bounce.setTo(1);
    this.world.scale.setTo(1);


    this.ball.body.collideWorldBounds = true;
  }
  update () {
    if (this.escape.isDown) {
      this.goHome();
    }

    if (this.left.isDown) {
      this.paddle.body.velocity.x = -300;
    } else if (this.right.isDown) {
      this.paddle.body.velocity.x = 300;
    } else this.paddle.body.velocity.x = 1;

    // Add collisions between the paddle and the ball
    if (this.physics.arcade.collide(this.paddle, this.ball)) {
      this.padHit.play();
    }
    // Call the 'hit' function when the ball hits a brick

    this.physics.arcade.collide(this.ball, this.bricks, this.hit, null, this);

    if (this.ball.y > this.paddle.y) {
      if (this.score > window.game.breakoutHighScore){
        window.game.breakoutHighScore = this.score;
        window.game.breakoutCounter = 1;
        window.game.breakoutScoreUpdate();
      }
      this.state.start('BreakoutGameOver');
      this.music.stop();
      this.dieSound.play();
      this.score = 0;
    }
    if (this.score === 300) {
      window.game.breakoutHighScore = this.score;
      this.state.start('BreakoutWin');
      window.game.breakoutScoreUpdate();
      window.game.breakoutCompleted();
      this.winSound.play();
      this.music.stop();
      this.score = 0;
    }
  }
  hit (ball, brick) {
    brick.kill();
    this.hitSound.play();
    this.score += 10;
    this.scoreText.text = 'Score: ' + this.score;
  }
  goHome () {
    this.state.start('BreakoutGameOver');
    this.score = 0;
  }
}
