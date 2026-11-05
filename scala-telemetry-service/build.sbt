name := "agile-rover-telemetry-stream"
version := "1.0.0"
scalaVersion := "3.3.3"

val pekkoVersion = "1.0.2"
val pekkoHttpVersion = "1.0.1"
val circeVersion = "0.14.9"
val logbackVersion = "1.4.14"

libraryDependencies ++= Seq(
  "org.apache.pekko" %% "pekko-actor-typed"   % pekkoVersion,
  "org.apache.pekko" %% "pekko-stream"        % pekkoVersion,
  "org.apache.pekko" %% "pekko-http"          % pekkoHttpVersion,
  "ch.qos.logback"    % "logback-classic"     % logbackVersion,
  "io.circe"         %% "circe-core"          % circeVersion,
  "io.circe"         %% "circe-generic"       % circeVersion,
  "io.circe"         %% "circe-parser"        % circeVersion,
  "org.scalameta"    %% "munit"               % "1.0.0" % Test
)

fork := true
javaOptions += "-Dslf4j.internal.verbosity=WARN"

