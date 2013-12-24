package models

import anorm._
import anorm.SqlParser._
import play.api.db._
import play.api.libs.json._
import play.api.Play.current

object Card {
  implicit val writes = new Writes[Card] {
    def writes(o: Card) = Json.obj(
      "word" -> o.word,
      "taboo" -> o.taboo
    )
  }

  def add(card: Card) = DB.withTransaction { implicit c =>
    val id = SQL("insert into words values (default, {word})")
      .on('word -> card.word)
      .executeInsert()
    id.map { id =>
      card.taboo.map { word =>
        SQL("insert into taboo values (default, {id}, {word})")
          .on('id -> id, 'word -> word)
          .executeInsert()
      }
    }
  }

  def getRandom() = DB.withConnection { implicit c =>
    val list = SQL("""
      with rand as (
        select * from words offset floor(random() * (select count(*) from words)) limit 1
      )
      select rand.word as word, taboo.word as taboo from taboo, rand where word_id = rand.id
    """)
    .list(str("word") ~ str("taboo") map flatten)

    mapToCard(list).head
  }

  def list() = DB.withConnection { implicit c =>
    val list = SQL("""
      select words.word as word, taboo.word as taboo
      from words left join taboo on word_id = words.id
    """)
    .list(str("word") ~ str("taboo") map flatten)

    mapToCard(list)
  }

  def mapToCard(seq: Seq[(String, String)]) = {
    seq.groupBy(_._1).map {
      case (word, taboos) => Card(word, taboos.map(_._2).toSet)
    }
  }
}


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
