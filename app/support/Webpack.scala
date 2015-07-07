package support

import scala.sys.process._

import play.api.templates.Html

object Webpack {
  val BIN = "./node_modules/.bin/webpack-dev-server"
  val PORT = "9001"
  val OPTS = Seq(
    "--inline",
    "--output-public-path", s"http://localhost:$PORT/assets/",
    "--port", PORT,
    "--hot"
  )

  val hotReloadScriptUrl = s"http://localhost:$PORT/assets/bundle.js"
  val hotReloadScript = Html(s"<script type='text/javascript' src='$hotReloadScriptUrl'></script>")

  var process: Option[Process] = None

  def startHotReloadServer() {
    if(process.isEmpty) {
      val logger = ProcessLogger(println, println)
      process = Some(Process(BIN, OPTS).run(logger))
    }
  }

  def stopHotReloadServer() {
    process.map(_.destroy())
  }
}
