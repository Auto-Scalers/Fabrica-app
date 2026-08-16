// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "FabricaComputerUseMacOS",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "FabricaComputerUseMacOSCore",
            targets: ["FabricaComputerUseMacOSCore"]
        ),
        .executable(
            name: "fabrica-computer-use-macos",
            targets: ["FabricaComputerUseMacOS"]
        )
    ],
    targets: [
        .target(
            name: "FabricaComputerUseMacOSCore",
            path: "Sources/FabricaComputerUseMacOSCore"
        ),
        .executableTarget(
            name: "FabricaComputerUseMacOS",
            dependencies: ["FabricaComputerUseMacOSCore"],
            path: "Sources/FabricaComputerUseMacOS"
        ),
        .testTarget(
            name: "FabricaComputerUseMacOSTests",
            dependencies: ["FabricaComputerUseMacOSCore"],
            path: "Tests/FabricaComputerUseMacOSTests"
        )
    ]
)
