import play.Project._

name := "gamenchat"

version := "1.0"

libraryDependencies ++= Seq(jdbc, anorm)

libraryDependencies += "postgresql" % "postgresql" % "9.1-901.jdbc4"

playScalaSettings
