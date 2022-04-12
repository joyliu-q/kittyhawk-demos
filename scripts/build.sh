#!/bin/bash
export GIT_SHA="TAG_FROM_CI"

# Generate yaml and add to products-dist
generate_yaml () {
  PRODUCT=$1
  export RELEASE_NAME=$PRODUCT
  yarn compile && yarn synth
  if [ ! -d "./products-dist/$PRODUCT-dist" ] 
  then
      mkdir -p "./products-dist/$PRODUCT-dist"
  fi
  cat ./dist/pennlabs.k8s.yaml > ./products-dist/$PRODUCT-dist/$PRODUCT.k8s.yaml 
}

# Build for all products
generate_yaml penn-basics
generate_yaml penn-clubs
generate_yaml penn-courses
generate_yaml penn-mobile
generate_yaml ohq
generate_yaml labs-api-server

