package controllers

import play.api._
import play.api.mvc._

import play.api.libs.json._
import play.api.libs.iteratee._

import models._

object Application extends Controller {

  /**
   * Just display the home page.
   */
  def index = Action { implicit request =>
    Ok(views.html.index())
  }

  def stats = Action {
    Ok(Json.obj(
      "rooms" -> ChatRoom.chatRooms.keySet,
      "activeConnections" -> ChatRoom.connectionCount,
      "totalCards" -> Card.size
    ))
  }

  /**
   * Handles the chat websocket.
   */
  def chat(username: String, room: String = "default") = WebSocket.async[JsValue] { request  =>
    ChatRoom.join(room, username)
  }

  val routeCache = {
    import routes._
    val jsRoutesClass = classOf[routes.javascript]
    val controllers = jsRoutesClass.getFields().map(_.get(null))
    controllers.flatMap { controller =>
      controller.getClass().getDeclaredMethods().map { action =>
        action.invoke(controller).asInstanceOf[play.core.Router.JavascriptReverseRoute]
      }
    }
  }

  def javascriptRoutes = Action { implicit request =>
    Ok(Routes.javascriptRouter("jsRoutes")(routeCache:_*)).as("text/javascript")
  }

}
