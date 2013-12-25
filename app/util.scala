package object util {
  def ifOpt[A](cond: => Boolean)(f: => A): Option[A] = {
    if(cond) {
      Some(f)
    }
    else {
      None
    }
  }
}
