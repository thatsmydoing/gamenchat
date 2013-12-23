import org.specs2.mutable._
import org.specs2.runner._
import org.junit.runner._

import play.api.test._
import play.api.test.Helpers._

import models.Card
import models.Team

@RunWith(classOf[JUnitRunner])
class ApplicationSpec extends Specification {

  "Card" should {

    val card = Card("test", Set("these", "words", "are", "not", "allowed"))

    "Check Taboo words correctly" in {
      card.isTaboo("test") must beTrue
      card.isTaboo("these") must beTrue
      card.isTaboo("words") must beTrue
      card.isTaboo("are") must beTrue
      card.isTaboo("not") must beTrue
      card.isTaboo("allowed") must beTrue
    }

    "Check guessed words correctly" in {
      card.isCorrect("test") must beTrue
      card.isCorrect("these") must beFalse
      card.isCorrect("words") must beFalse
      card.isCorrect("are") must beFalse
      card.isCorrect("not") must beFalse
      card.isCorrect("allowed") must beFalse
    }

    "Check case insensitively" in {
      card.isCorrect("test") must beTrue
      card.isCorrect("Test") must beTrue
      card.isCorrect("tEst") must beTrue
      card.isCorrect("teSt") must beTrue
      card.isCorrect("tesT") must beTrue
      card.isCorrect("TEST") must beTrue
      card.isTaboo("These") must beTrue
      card.isTaboo("wOrds") must beTrue
      card.isTaboo("arE") must beTrue
      card.isTaboo("nOt") must beTrue
      card.isTaboo("ALLOWED") must beTrue
    }

    "Check the entire message" in {
      card.isTaboo("The word is test") must beTrue
      card.isTaboo("I am not allowed to say") must beTrue
      card.isTaboo("swords") must beTrue
    }

  }

  "Team" should {
    val team = new Team()

    "Allow players to join" in {
      team.join("player1")
      team.join("player2")
      team.join("player2")
      team.join("player3")

      team.hasPlayer("player1") must beTrue
      team.hasPlayer("player2") must beTrue
      team.hasPlayer("player3") must beTrue
      team.hasPlayer("player4") must beFalse
    }

    "Allow players to leave" in {
      team.leave("player3")
      team.hasPlayer("player3") must beFalse

      // should be a noop
      team.leave("player3")
      team.hasPlayer("player3") must beFalse
    }

    "Cycle between players correctly" in {
      team.nextPlayer() must equalTo("player1")
      team.nextPlayer() must equalTo("player2")
      team.nextPlayer() must equalTo("player1")
      team.join("player3")
      team.join("player4")
      team.nextPlayer() must equalTo("player2")
      team.nextPlayer() must equalTo("player3")
      team.nextPlayer() must equalTo("player4")
      team.nextPlayer() must equalTo("player1")
      team.nextPlayer() must equalTo("player2")
      team.leave("player3")
      team.nextPlayer() must equalTo("player4")
      team.leave("player4")
      team.nextPlayer() must equalTo("player1")
      team.nextPlayer() must equalTo("player2")
    }

    "Give the correct current player and guessers" in {
      team.nextPlayer() must equalTo("player1")
      team.player must equalTo("player1")
      team.guessers("player2") must beTrue
    }
  }
}
