package models

import akka.actor._
import scala.concurrent.duration._
import play.api.libs.concurrent._
import play.api.libs.json._
import play.api.Play.current
import play.api.libs.concurrent.Execution.Implicits._

object Team {
  implicit val writes = new Writes[Team] {
    def writes(o: Team) = Json.obj(
      "members" -> o.members,
      "player" -> o.player,
      "guessers" -> o.guessers
    )
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

object Round {
  val DURATION = 60

  implicit val writes = new Writes[Round] {
    def writes(o: Round) = Json.obj(
      "team" -> o.team,
      "monitors" -> o.monitors,
      "remainingTime" -> o.remainingTime
    )
  }
}

case class Round(
  team: Team,
  monitors: Set[String],
  startTime: Long = System.currentTimeMillis
) {
  def remainingTime = {
    val sinceStart = (System.currentTimeMillis - startTime) / 1000
    Math.max(0, Round.DURATION - sinceStart)
  }
}

case class Information(text: String)
case class Guess(username: String, text: String)
case object Pass
case class Taboo(username: String)
case object End

case class Score(kind: String, points: Int, card: Card, username: String = "")

case object NextCard
case object PrepRound
case object StartRound
case class EndRound(points: Int, card: Option[Card])

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
      announceStatus("join", username)
      if(round.isEmpty) {
        self ! PrepRound
      }

    case Quit(username) =>
      teamA.leave(username)
      teamB.leave(username)
      announceStatus("quit", username)
      if(teamA.size < 2 || currentTeam == teamB && teamB.size < 2) {
        if(ready) {
          ready = false
        }
        if(!round.isEmpty) {
          roundActor ! End
        }
      }

    case Talk(username, "/status") => announceStatus()

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

    case Score(kind, points, card, user) =>
      chatActor ! Announce(Json.obj(
        "kind" -> "point",
        "action" -> kind,
        "card" -> card,
        "user" -> user
      ))
      self ! NextCard

    case NextCard =>
      val card = Card.getRandom()
      roundActor ! card

      val message = Json.obj(
        "kind" -> "card",
        "card" -> card
      )

      (round.get.monitors + player).foreach { user =>
        chatActor ! Tell(user, message)
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

        chatActor ! Announce(Json.obj(
          "kind" -> "roundReady",
          "player" -> currentTeam.player
        ))
      }

    case StartRound =>
      round = Some(Round(currentTeam, opposingTeam.members.toSet))
      roundActor = context.actorOf(Props[TabooRound])
      Akka.system.scheduler.scheduleOnce(1 minute, roundActor, End)
      chatActor ! Announce(Json.obj(
        "kind" -> "roundStart",
        "round" -> round
      ))
      self ! NextCard

    case EndRound(points, card) =>
      chatActor ! Announce(Json.obj(
        "kind" -> "roundEnd",
        "points" -> points,
        "card" -> card
      ))
      round = None
      ready = false
      self ! PrepRound

  }

  def player = round.get.team.player

  def announceStatus(kind: String = "status", user: String = "*GM") {
    chatActor ! Announce(Json.obj(
      "kind" -> kind,
      "user" -> user,
      "round" -> round,
      "teamA" -> teamA,
      "teamB" -> teamB
    ))
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
        sender ! Score("correct", points, card, username)
        this.card = None
      }
    }

    case Information(text) => card.map { card =>
      if(card.isTaboo(text)) {
        points -= 1
        sender ! Score("invalid", points, card)
        this.card = None
      }
    }

    case Pass => card.map { card =>
      points -= 1
      sender ! Score("pass", points, card)
      this.card = None
    }

    case Taboo(username) => card.map { card =>
      points -= 1
      sender ! Score("taboo", points, card)
      this.card = None
    }

    case End =>
      sender ! EndRound(points, card)
      context.stop(self)

  }

}
