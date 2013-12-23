package models

import akka.actor._
import scala.concurrent.duration._
import play.api.libs.concurrent._
import play.api.Play.current
import play.api.libs.concurrent.Execution.Implicits._

case class Card(word: String, taboo: Set[String]) {

  def isTaboo(text: String) = {
    val lower = text.toLowerCase
    def contains(word: String) = {
      lower.indexOf(word.toLowerCase) >= 0
    }

    // check if text contains word or anything in taboo
    (taboo + word).map(contains).foldLeft(false)(_ || _)
  }

  def isCorrect(text: String) = {
    text.toLowerCase.indexOf(word.toLowerCase) >= 0
  }

}

class Team {
  var members = List.empty[String]
  var player = ""
  var guessers = Set.empty[String]

  def hasPlayer(user: String) = members.indexOf(user) >= 0

  def nextPlayer() = {
    val index = (members.indexOf(player) + 1) % members.size
    player = members(index)
    guessers = members.filterNot(_ == player).toSet
    player
  }

  def join(user: String) = {
    if(!hasPlayer(user)) {
      members = members :+ user
    }
  }

  def leave(user: String) = {
    members = members.filterNot(_ == user)
  }

  def isEmpty = members.isEmpty

  def size = members.size
}

case class Round(team: Team, monitors: Set[String])

case class Information(text: String)
case class Guess(username: String, text: String)
case object Pass
case class Taboo(username: String)

case class Correct(username: String, card: Card)
case class Invalid(card: Card)
case class Passed(card: Card)
case class Tabooed(username: String, card: Card)

case object NextCard
case object PrepRound
case object StartRound
case object End
case class Points(points: Int)

class TabooGame(val chatActor: ActorRef) extends Actor {
  var ready = false
  var round: Option[Round] = None
  var roundActor: ActorRef = null

  val teamA: Team = new Team
  val teamB: Team = new Team

  var currentTeam: Team = teamB
  var opposingTeam: Team = teamA

  def receive = {
    case Join(username) =>
      if(teamA.size < 2 || teamA.size <= teamB.size) {
        teamA.join(username)
      }
      else {
        teamB.join(username)
      }
      if(round.isEmpty) {
        self ! PrepRound
      }

    case Quit(username) =>
      teamA.leave(username)
      teamB.leave(username)
      if(!round.isEmpty && (teamA.size < 2 || (currentTeam == teamB && teamB.size < 2))) {
        roundActor ! End
      }

    case Talk(username, text) => round match {
      case Some(round) =>
        if(username == round.team.player) {
          if(text == "/pass") {
            roundActor ! Pass
          }
          else {
            roundActor ! Information(text)
          }
        }
        else if(round.team.guessers(username)) {
          roundActor ! Guess(username, text)
        }
        else if(round.monitors(username) && text == "/taboo") {
          roundActor ! Taboo(username)
        }

      case None =>
        if(username == currentTeam.player && text == "/start") {
          self ! StartRound
        }
    }

    case Correct(username, card) =>
      nextCard(username+" got it right!", card)

    case Invalid(card) =>
      nextCard("Uh-uh! "+player+" said a taboo word. Sorry.", card)

    case Passed(card) =>
      nextCard(player+" has passed.", card)

    case Tabooed(username, card) =>
      nextCard("Oh no! "+player+" apparently said a taboo word. :(", card)

    case Points(points) =>
      chatActor ! Talk("*GM", "The round is over. The team got "+points)
      round = None
      ready = false
      self ! PrepRound

    case NextCard =>
      val card = randomCard()
      roundActor ! card

      (round.get.monitors + player).foreach { user =>
        chatActor ! Tell(
          "*GM",
          "The word is "+card.word+". The taboo words are: "+card.taboo.reduceLeft(_+" "+_),
          user)
      }

    case PrepRound =>
      if(!ready && teamA.size >= 2) {
        ready = true

        if(teamB.size < 2) {
          currentTeam = teamA
          opposingTeam = teamB
        }
        else {
          val temp = currentTeam
          currentTeam = opposingTeam
          opposingTeam = temp
        }
        currentTeam.nextPlayer()

        chatActor ! Talk("*GM", "Next round, the player will be "+currentTeam.player)
        chatActor ! Tell("*GM", "Type /start to start the round", currentTeam.player)
      }

    case StartRound =>
      round = Some(Round(currentTeam, opposingTeam.members.toSet))
      roundActor = context.actorOf(Props[TabooRound])
      Akka.system.scheduler.scheduleOnce(1 minute, roundActor, End)
      self ! NextCard
  }

  def player = round.get.team.player

  def randomCard() = Card("test", Set("a", "b", "c", "d", "e"))

  def nextCard(message: String, oldCard: Card) = {
    chatActor ! Talk("*GM", message+" The word was "+oldCard.word+".")
    self ! NextCard
  }

  self ! PrepRound
}

class TabooRound extends Actor {
  var card: Option[Card] = None
  var points = 0

  def receive = {
    case newCard: Card =>
      card = Some(newCard)

    case Guess(username, text) => card.map { card =>
      if(card.isCorrect(text)) {
        points += 1
        sender ! Correct(username, card)
        this.card = None
      }
    }

    case Information(text) => card.map { card =>
      if(card.isTaboo(text)) {
        points -= 1
        sender ! Invalid(card)
        this.card = None
      }
    }

    case Pass => card.map { card =>
      points -= 1
      sender ! Passed(card)
      this.card = None
    }

    case Taboo(username) => card.map { card =>
      points -= 1
      sender ! Tabooed(username, card)
      this.card = None
    }

    case End =>
      sender ! Points(points)
      context.stop(self)

  }

}
