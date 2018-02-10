import play.Project._

name := "gamenchat"

version := "1.0"

libraryDependencies ++= Seq(jdbc, anorm)

libraryDependencies += "org.xerial" % "sqlite-jdbc" % "3.21.0.1"

playScalaSettings
