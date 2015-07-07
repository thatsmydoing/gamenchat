import play.api._

import support.Webpack

object Global extends GlobalSettings {
  override def onStart(app: play.api.Application){
    Webpack.startHotReloadServer()
  }
  override def onStop(app: play.api.Application){
    Webpack.stopHotReloadServer()
  }
}
