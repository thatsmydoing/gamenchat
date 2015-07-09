import play.Project._

name := "gamenchat"

version := "1.0"

libraryDependencies ++= Seq(jdbc, anorm)

libraryDependencies += "postgresql" % "postgresql" % "9.1-901.jdbc4"

libraryDependencies += "org.webjars" % "bootstrap" % "3.0.3"

libraryDependencies += "org.webjars" %% "webjars-play" % "2.2.2-1"

playScalaSettings
