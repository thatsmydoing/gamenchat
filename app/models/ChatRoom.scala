package models

import akka.actor._
import scala.concurrent.duration._
import scala.language.postfixOps

import play.api._
import play.api.libs.json._
import play.api.libs.iteratee._
import play.api.libs.concurrent._

import akka.util.Timeout
import akka.pattern.ask

import play.api.Play.current
import play.api.libs.concurrent.Execution.Implicits._

object ChatRoom {

  implicit val timeout = Timeout(1 second)

  lazy val default = Akka.system.actorOf(Props[ChatRoom])

  def join(username:String):scala.concurrent.Future[(Iteratee[JsValue,_],Enumerator[JsValue])] = {

    (default ? Join(username)).map {

      case Connected(enumerator) =>

        // Create an Iteratee to consume the feed
        val iteratee = Iteratee.foreach[JsValue] { event =>
          default ! Talk(username, (event \ "text").as[String])
        }.map { _ =>
          default ! Quit(username)
        }

        (iteratee,enumerator)

      case CannotConnect(error) =>

        // Connection error

        // A finished Iteratee sending EOF
        val iteratee = Done[JsValue,Unit]((),Input.EOF)

        // Send an error and close the socket
        val enumerator =  Enumerator[JsValue](JsObject(Seq("error" -> JsString(error)))).andThen(Enumerator.enumInput(Input.EOF))

        (iteratee,enumerator)

    }

  }

}

class ChatRoom extends Actor {

  val tabooGame = Akka.system.actorOf(Props(classOf[TabooGame], self))

  var members = Map.empty[String, Concurrent.Channel[JsValue]]
  val (chatEnumerator, chatChannel) = Concurrent.broadcast[JsValue]

  def receive = {

    case Join(username) => {
      if(members.contains(username)) {
        sender ! CannotConnect("This username is already used")
      } else {
        val (personalEnumerator, personalChannel) = Concurrent.broadcast[JsValue]
        members = members + (username -> personalChannel)
        sender ! Connected(chatEnumerator.interleave(personalEnumerator))
        tabooGame ! Join(username)
      }
    }

    case Talk(username, text) => {
      if(!text.startsWith("/")) {
        self ! Announce(Json.obj(
          "kind" -> "talk",
          "user" -> username,
          "message" -> text
        ))
      }
      tabooGame ! Talk(username, text)
    }

    case Announce(message) => {
      chatChannel.push(message)
    }

    case Tell(username, message) => {
      members(username).push(message)
    }

    case Quit(username) => {
      members = members - username
      tabooGame ! Quit(username)
    }

  }

}

case class Join(username: String)
case class Quit(username: String)
case class Talk(username: String, text: String)
case class Announce(value: JsValue)
case class Tell(username: String, value: JsValue)

case class Connected(enumerator:Enumerator[JsValue])
case class CannotConnect(msg: String)
