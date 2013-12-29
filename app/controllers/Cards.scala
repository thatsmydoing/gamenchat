package controllers

import play.api._
import play.api.mvc._

import play.api.data._
import play.api.data.Forms._
import play.api.libs.json._

import models._

object Cards extends Controller {

  val cardForm = Form(mapping(
    "word" -> text,
    "taboos" -> seq(text).transform(_.toSet, (set: Set[String]) => set.toSeq)
  )(Card.apply)(Card.unapply))

  def add = Action(parse.json) { implicit request =>
    cardForm.bindFromRequest.fold(
      { case error => BadRequest("invalid format") },
      { case card =>
        Card.add(card)
        Ok("ok")
      }
    )
  }

  def exists(word: String) = Action {
    Ok(Json.obj(
      "word" -> word,
      "exists" -> Card.exists(word)
    ))
  }

  def dump = Action {
    Ok(Json.toJson(Card.list()))
  }

  var cardPool = CardPool.get()

  def random = Action {
    if(!cardPool.hasNext) {
      cardPool = CardPool.get()
    }
    Ok(Json.toJson(cardPool.next()))
  }

}
